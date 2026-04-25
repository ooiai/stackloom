use common::config::env_config::EnvConfig;
use domain_system::aws::{AwsStsService, ObjectStorageService};
use neocrates::{
    async_trait::async_trait,
    aws::{
        aws_service::AwsService,
        sts_service::{AwsConfig, AwsStsVo, CosService},
    },
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    tracing,
};
use std::sync::Arc;

pub struct AwsCosServiceImpl {
    aws_config: Arc<AwsConfig>,
    redis_pool: RedisPool,
    object_endpoint: String,
    object_bucket: String,
    object_host: String,
    base_url: String,
}

impl AwsCosServiceImpl {
    fn resolve_object_target(aws_config: &AwsConfig) -> (String, String) {
        match aws_config.cos_type.as_str() {
            "aliyun" => (
                aws_config.aliyun_endpoint.clone(),
                aws_config.aliyun_bucket.clone(),
            ),
            "minio" => (
                aws_config.minio_endpoint.clone(),
                aws_config.minio_bucket.clone(),
            ),
            _ => (
                aws_config.rustfs_endpoint.clone(),
                aws_config.rustfs_bucket.clone(),
            ),
        }
    }

    fn get_base_url_from_env_config(
        env_aws_cos_config: &common::config::env_config::AwsCosConfig,
    ) -> String {
        match env_aws_cos_config.cos_type.as_str() {
            "aliyun" => env_aws_cos_config.aliyun_base_url.clone(),
            "minio" => env_aws_cos_config.minio_base_url.clone(),
            _ => env_aws_cos_config.rustfs_base_url.clone(),
        }
    }

    fn endpoint_host(endpoint: &str) -> String {
        endpoint
            .trim()
            .trim_end_matches('/')
            .split_once("://")
            .map(|(_, host)| host)
            .unwrap_or(endpoint)
            .trim_matches('/')
            .to_string()
    }

    fn build_object_url_from_base(&self, base: &str, key: &str) -> String {
        let base = base.trim().trim_end_matches('/');
        let key = key.trim().trim_start_matches('/');

        if base.is_empty() {
            return key.to_string();
        }
        if self.object_bucket.is_empty() {
            return format!("{}/{}", base, key);
        }
        if base.ends_with(&format!("/{}", self.object_bucket)) {
            return format!("{}/{}", base, key);
        }
        format!("{}/{}/{}", base, self.object_bucket, key)
    }

    fn redact_url(url: &str) -> String {
        url.split('?').next().unwrap_or(url).to_string()
    }

    fn resolve_signed_expiration(&self, expires_in: u64) -> u64 {
        if expires_in > 0 {
            return expires_in;
        }
        match self.aws_config.cos_type.as_str() {
            "aliyun" => self.aws_config.aliyun_expiration as u64,
            "minio" => self.aws_config.minio_expiration as u64,
            _ => self.aws_config.rustfs_expiration as u64,
        }
    }

    async fn download_via_http_url(&self, download_url: &str) -> AppResult<Vec<u8>> {
        let client = neocrates::reqwest::Client::new();
        let safe_url = Self::redact_url(download_url);
        let response = client.get(download_url).send().await.map_err(|err| {
            AppError::ClientError(format!(
                "Failed to download from URL: {} err: {}",
                safe_url, err
            ))
        })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AppError::ClientError(format!(
                "Download failed with status: {} for URL: {} body: {}",
                status, safe_url, body
            )));
        }

        let bytes = response.bytes().await.map_err(|err| {
            AppError::ClientError(format!(
                "Failed to read response bytes from URL: {} err: {}",
                safe_url, err
            ))
        })?;

        Ok(bytes.to_vec())
    }

    pub fn new(cfg: EnvConfig, redis_pool: RedisPool) -> Self {
        let aws_cos_cfg = &cfg.aws_cos;
        let base_url = Self::get_base_url_from_env_config(aws_cos_cfg);
        let aws_config: AwsConfig = aws_cos_cfg.clone().into();
        let (object_endpoint, object_bucket) = Self::resolve_object_target(&aws_config);
        let object_host = Self::endpoint_host(&object_endpoint);
        let aws_config = Arc::new(aws_config);
        let normalized_endpoint = object_endpoint.trim().trim_end_matches('/').to_string();
        let normalized_base_url = base_url.trim().trim_end_matches('/').to_string();
        let normalized_bucket = object_bucket.trim().trim_matches('/').to_string();

        tracing::info!(
            "object storage resolved: cos_type={} endpoint={} base_url={} bucket={}",
            aws_config.cos_type,
            normalized_endpoint,
            normalized_base_url,
            normalized_bucket
        );

        AwsService::init_from_env_config(&aws_config);

        Self {
            aws_config,
            redis_pool,
            object_endpoint: normalized_endpoint,
            object_bucket: normalized_bucket,
            object_host,
            base_url: normalized_base_url,
        }
    }
}

#[async_trait]
impl AwsStsService for AwsCosServiceImpl {
    async fn get_sts(&self, uid: i64) -> AppResult<AwsStsVo> {
        let redis_pool = Arc::new(self.redis_pool.clone());
        let result = CosService::get_cos_sts(&self.aws_config, &redis_pool, uid).await?;
        Ok(result)
    }
}

#[async_trait]
impl ObjectStorageService for AwsCosServiceImpl {
    async fn put_object(&self, path: &str, data: Vec<u8>) -> AppResult<()> {
        AwsService::put_object(path, data).await
    }

    async fn download_object(&self, path: &str) -> AppResult<Vec<u8>> {
        match AwsService::download_object(path).await {
            Ok(bytes) => Ok(bytes),
            Err(sdk_err) => {
                let key = path.trim().trim_start_matches('/').to_string();
                let primary_base = if self.base_url.is_empty() {
                    self.object_endpoint.as_str()
                } else {
                    self.base_url.as_str()
                };
                let primary_url = self.build_object_url_from_base(primary_base, &key);

                tracing::warn!(
                    "object download via SDK failed, fallback to HTTP GET: path={} primary_url={} err={}",
                    path,
                    primary_url,
                    sdk_err
                );

                match self.download_via_http_url(&primary_url).await {
                    Ok(bytes) => Ok(bytes),
                    Err(primary_err) => {
                        if primary_base == self.object_endpoint {
                            return Err(AppError::ClientError(format!(
                                "download failed via SDK and HTTP fallback: path={} sdk_err={} http_err={}",
                                path, sdk_err, primary_err
                            )));
                        }

                        let secondary_url =
                            self.build_object_url_from_base(&self.object_endpoint, &key);
                        tracing::warn!(
                            "object download primary HTTP fallback failed, trying endpoint URL: path={} secondary_url={} err={}",
                            path,
                            secondary_url,
                            primary_err
                        );
                        self.download_via_http_url(&secondary_url).await.map_err(|secondary_err| {
                            AppError::ClientError(format!(
                                "download failed via SDK and all HTTP fallbacks: path={} sdk_err={} base_url_err={} endpoint_err={}",
                                path, sdk_err, primary_err, secondary_err
                            ))
                        })
                    }
                }
            }
        }
    }

    fn normalize_object_path(&self, raw_path: &str) -> Option<String> {
        let trimmed = raw_path.trim();
        if trimmed.is_empty() {
            return None;
        }

        let without_query = trimmed.split('?').next().unwrap_or(trimmed);
        let mut path =
            if without_query.starts_with("http://") || without_query.starts_with("https://") {
                without_query
                    .split_once("://")
                    .map(|(_, v)| v)
                    .unwrap_or(without_query)
                    .split_once('/')
                    .map(|(_, path)| path)
                    .unwrap_or_default()
                    .to_string()
            } else {
                without_query.trim_start_matches('/').to_string()
            };
        if path.is_empty() {
            return None;
        }

        if !self.object_host.is_empty() {
            let host_prefix = format!("{}/", self.object_host);
            if let Some(rest) = path.strip_prefix(&host_prefix) {
                path = rest.to_string();
            }
        }

        if !self.object_bucket.is_empty() {
            let bucket_prefix = format!("{}/", self.object_bucket);
            if let Some(rest) = path.strip_prefix(&bucket_prefix) {
                path = rest.to_string();
            }
        }

        if path.is_empty() {
            return None;
        }
        Some(path)
    }

    fn build_public_url(&self, path: &str) -> String {
        let path = path.trim();
        if path.starts_with("http://") || path.starts_with("https://") {
            return path.to_string();
        }

        let key = path.trim_start_matches('/');
        let base = if self.base_url.is_empty() {
            self.object_endpoint.as_str()
        } else {
            self.base_url.as_str()
        };
        self.build_object_url_from_base(base, key)
    }

    async fn get_signed_url(&self, path: &str, expires_in: u64) -> AppResult<String> {
        let key = path.trim().trim_start_matches('/');
        if key.is_empty() {
            return Err(AppError::ClientError(
                "get_signed_url path is empty".to_string(),
            ));
        }
        let expiration = self.resolve_signed_expiration(expires_in);
        AwsService::get_signed_url(key, expiration).await
    }

    async fn download_object_via_signed_url(
        &self,
        path: &str,
        expires_in: u64,
    ) -> AppResult<Vec<u8>> {
        let key = path.trim().trim_start_matches('/').to_string();
        if key.is_empty() {
            return Err(AppError::ClientError(
                "download_object_via_signed_url path is empty".to_string(),
            ));
        }
        let expiration = self.resolve_signed_expiration(expires_in);
        AwsService::download_object_via_signed_url(&key, expiration)
            .await
            .map_err(|err| {
                AppError::ClientError(format!(
                    "download_object_via_signed_url failed: path={} err={}",
                    path, err
                ))
            })
    }

    async fn put_object_via_http(&self, path: &str, data: Vec<u8>) -> AppResult<()> {
        let sdk_err = match AwsService::put_object(path, data.clone()).await {
            Ok(()) => return Ok(()),
            Err(err) => err,
        };

        let key = path.trim().trim_start_matches('/').to_string();
        if key.is_empty() {
            return Err(AppError::ClientError(
                "put_object_via_http path is empty".to_string(),
            ));
        }

        let expiration = self.resolve_signed_expiration(0);
        tracing::warn!(
            "object put via SDK failed, fallback to signed HTTP PUT: path={} err={}",
            path,
            sdk_err
        );
        AwsService::put_object_via_signed_url(&key, data, expiration)
            .await
            .map_err(|err| {
                AppError::ClientError(format!(
                    "put_object_via_http signed fallback failed: path={} err={}",
                    path, err
                ))
            })
    }
}
