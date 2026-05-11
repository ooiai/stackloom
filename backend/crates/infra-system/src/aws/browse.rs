use std::time::Duration;

use common::config::env_config::EnvConfig;
use domain_system::aws::{
    PageStorageObjectCmd, PageStorageObjectResult, SignStorageObjectCmd, StorageBrowseService,
    StorageGetResult, StorageObjectItem, StorageProviderInfo,
};
use neocrates::{
    async_trait::async_trait,
    aws_config::meta::region::RegionProviderChain,
    aws_sdk_s3::{
        Client,
        config::{Builder as S3ConfigBuilder, Credentials, Region},
        presigning::PresigningConfig,
    },
    chrono::{DateTime, Utc},
    response::error::{AppError, AppResult},
};

const DEFAULT_PAGE_SIZE: i32 = 20;
const MAX_PAGE_SIZE: i32 = 100;

#[derive(Debug, Clone)]
struct StorageProviderConfig {
    info: StorageProviderInfo,
    region: String,
    endpoint: String,
    access_key: String,
    secret_key: String,
    base_url: String,
    force_path_style: bool,
}

impl StorageProviderConfig {
    fn new(
        code: &str,
        label: &str,
        bucket: &str,
        region: &str,
        endpoint: &str,
        access_key: &str,
        secret_key: &str,
        base_url: &str,
        force_path_style: bool,
    ) -> Option<Self> {
        let bucket = bucket.trim();
        let region = region.trim();
        let endpoint = endpoint.trim();
        let access_key = access_key.trim();
        let secret_key = secret_key.trim();
        if bucket.is_empty()
            || region.is_empty()
            || endpoint.is_empty()
            || access_key.is_empty()
            || secret_key.is_empty()
        {
            return None;
        }

        Some(Self {
            info: StorageProviderInfo {
                code: code.to_string(),
                label: label.to_string(),
                bucket: bucket.to_string(),
                endpoint: endpoint.to_string(),
            },
            region: region.to_string(),
            endpoint: endpoint.to_string(),
            access_key: access_key.to_string(),
            secret_key: secret_key.to_string(),
            base_url: base_url.trim().to_string(),
            force_path_style,
        })
    }

    fn normalized_endpoint(&self) -> String {
        let trimmed = self.endpoint.trim().trim_end_matches('/');
        if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
            return trimmed.to_string();
        }
        format!("https://{trimmed}")
    }

    fn build_public_url(&self, bucket: &str, key: &str) -> String {
        let base = if self.base_url.trim().is_empty() {
            self.normalized_endpoint()
        } else {
            self.base_url.trim().trim_end_matches('/').to_string()
        };
        let bucket = bucket.trim();
        let key = key.trim().trim_start_matches('/');

        if self.base_url.trim().is_empty() {
            if self.force_path_style {
                return format!("{}/{}/{}", base, bucket, key);
            }

            if let Some((scheme, host)) = base.split_once("://") {
                return format!(
                    "{scheme}://{}.{}{}",
                    bucket,
                    host,
                    format!("/{key}")
                );
            }
        }

        if base.ends_with(&format!("/{}", bucket)) {
            return format!("{base}/{key}");
        }

        format!("{}/{}/{}", base, bucket, key)
    }
}

pub struct StorageBrowseServiceImpl {
    providers: Vec<StorageProviderConfig>,
}

impl StorageBrowseServiceImpl {
    pub fn new(cfg: EnvConfig) -> Self {
        let providers = vec![
            StorageProviderConfig::new(
                "aliyun",
                "Aliyun OSS",
                &cfg.aws_cos.aliyun_bucket,
                &cfg.aws_cos.aliyun_region_id,
                &cfg.aws_cos.aliyun_endpoint,
                &cfg.aws_cos.aliyun_accesskey_id,
                &cfg.aws_cos.aliyun_accesskey_secret,
                &cfg.aws_cos.aliyun_base_url,
                false,
            ),
            StorageProviderConfig::new(
                "rustfs",
                "RustFS",
                &cfg.aws_cos.rustfs_bucket,
                &cfg.aws_cos.rustfs_region_id,
                &cfg.aws_cos.rustfs_endpoint,
                &cfg.aws_cos.rustfs_accesskey_id,
                &cfg.aws_cos.rustfs_accesskey_secret,
                &cfg.aws_cos.rustfs_base_url,
                true,
            ),
            StorageProviderConfig::new(
                "minio",
                "MinIO",
                &cfg.aws_cos.minio_bucket,
                &cfg.aws_cos.minio_region_id,
                &cfg.aws_cos.minio_endpoint,
                &cfg.aws_cos.minio_accesskey_id,
                &cfg.aws_cos.minio_accesskey_secret,
                &cfg.aws_cos.minio_base_url,
                true,
            ),
        ]
        .into_iter()
        .flatten()
        .collect();

        Self { providers }
    }

    fn page_size(page_size: Option<i32>) -> i32 {
        page_size
            .unwrap_or(DEFAULT_PAGE_SIZE)
            .clamp(1, MAX_PAGE_SIZE)
    }

    fn normalize_key(value: &str, field: &str) -> AppResult<String> {
        let key = value.trim().trim_start_matches('/').to_string();
        if key.is_empty() || key.contains("..") {
            return Err(AppError::ValidationError(format!("{field} is invalid")));
        }
        Ok(key)
    }

    fn normalize_prefix(prefix: Option<String>) -> AppResult<Option<String>> {
        prefix
            .map(|value| {
                let trimmed = value.trim().trim_matches('/').to_string();
                if trimmed.is_empty() || trimmed.contains("..") {
                    return Err(AppError::ValidationError("prefix is invalid".to_string()));
                }
                Ok(trimmed)
            })
            .transpose()
    }

    fn normalize_bucket(bucket: Option<String>) -> AppResult<Option<String>> {
        bucket
            .map(|value| {
                let trimmed = value.trim().to_string();
                if trimmed.is_empty() || trimmed.contains('/') || trimmed.contains("..") {
                    return Err(AppError::ValidationError("bucket is invalid".to_string()));
                }
                Ok(trimmed)
            })
            .transpose()
    }

    fn resolve_bucket(
        provider: &StorageProviderConfig,
        bucket: Option<String>,
    ) -> AppResult<String> {
        Ok(Self::normalize_bucket(bucket)?.unwrap_or_else(|| provider.info.bucket.clone()))
    }

    fn provider(&self, code: &str) -> AppResult<&StorageProviderConfig> {
        self.providers
            .iter()
            .find(|provider| provider.info.code == code)
            .ok_or_else(|| AppError::ValidationError("provider is invalid".to_string()))
    }

    async fn client(&self, provider: &StorageProviderConfig) -> AppResult<Client> {
        let region_provider = RegionProviderChain::first_try(Region::new(provider.region.clone()));
        let config_loader = neocrates::aws_config::from_env()
            .region(region_provider)
            .endpoint_url(provider.normalized_endpoint())
            .credentials_provider(Credentials::new(
                provider.access_key.clone(),
                provider.secret_key.clone(),
                None,
                None,
                "storage",
            ));
        let shared_config = config_loader.load().await;
        let s3_config = S3ConfigBuilder::from(&shared_config)
            .force_path_style(provider.force_path_style)
            .build();
        Ok(Client::from_conf(s3_config))
    }

    fn to_datetime(
        value: Option<&neocrates::aws_sdk_s3::primitives::DateTime>,
    ) -> Option<DateTime<Utc>> {
        value
            .and_then(|date_time| date_time.to_millis().ok())
            .and_then(DateTime::<Utc>::from_timestamp_millis)
    }
}

#[async_trait]
impl StorageBrowseService for StorageBrowseServiceImpl {
    async fn get(&self) -> AppResult<StorageGetResult> {
        let providers = self
            .providers
            .iter()
            .map(|provider| provider.info.clone())
            .collect::<Vec<_>>();
        let default_provider = providers
            .first()
            .map(|provider| provider.code.clone())
            .ok_or_else(|| {
                AppError::ClientError("storage providers are not configured".to_string())
            })?;

        Ok(StorageGetResult {
            providers,
            default_provider,
        })
    }

    async fn page(&self, cmd: PageStorageObjectCmd) -> AppResult<PageStorageObjectResult> {
        let prefix = Self::normalize_prefix(cmd.prefix)?;
        let provider = self.provider(&cmd.provider)?;
        let bucket = Self::resolve_bucket(provider, cmd.bucket)?;
        let client = self.client(provider).await?;
        let mut request = client
            .list_objects_v2()
            .bucket(&bucket)
            .max_keys(Self::page_size(cmd.page_size));

        if let Some(prefix) = prefix.as_deref() {
            request = request.prefix(prefix);
        }
        if let Some(token) = cmd
            .continuation_token
            .as_deref()
            .map(str::trim)
            .filter(|token| !token.is_empty())
        {
            request = request.continuation_token(token);
        }

        let response = request
            .send()
            .await
            .map_err(|err| AppError::ClientError(format!("list storage objects failed: {err}")))?;

        let items = response
            .contents()
            .iter()
            .filter_map(|item| {
                item.key().map(|key| StorageObjectItem {
                    provider: provider.info.code.clone(),
                    bucket: bucket.clone(),
                    key: key.to_string(),
                    size: item.size().unwrap_or_default(),
                    etag: item.e_tag().map(ToString::to_string),
                    last_modified: Self::to_datetime(item.last_modified()),
                    storage_class: item.storage_class().map(|value| value.as_str().to_string()),
                    public_url: provider.build_public_url(&bucket, key),
                })
            })
            .collect::<Vec<_>>();
        let mut provider_info = provider.info.clone();
        provider_info.bucket = bucket;

        Ok(PageStorageObjectResult {
            provider: provider_info,
            items,
            next_token: response.next_continuation_token().map(ToString::to_string),
            is_truncated: response.is_truncated().unwrap_or(false),
        })
    }

    async fn sign(&self, cmd: SignStorageObjectCmd) -> AppResult<String> {
        let provider = self.provider(&cmd.provider)?;
        let bucket = Self::resolve_bucket(provider, cmd.bucket)?;
        let key = Self::normalize_key(&cmd.key, "key")?;
        let client = self.client(provider).await?;
        let presign_config = PresigningConfig::expires_in(Duration::from_secs(
            cmd.expires_in.unwrap_or(3600).max(1),
        ))
        .map_err(|err| AppError::ClientError(format!("build presign config failed: {err}")))?;

        client
            .get_object()
            .bucket(bucket)
            .key(key)
            .presigned(presign_config)
            .await
            .map(|request| request.uri().to_string())
            .map_err(|err| AppError::ClientError(format!("sign storage object failed: {err}")))
    }
}
