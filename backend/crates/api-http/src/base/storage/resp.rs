use domain_system::aws::{
    PageStorageObjectResult, StorageGetResult, StorageObjectItem, StorageProviderInfo,
};
use neocrates::{
    chrono::{DateTime, Utc},
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct StorageProviderResp {
    pub code: String,
    pub label: String,
    pub bucket: String,
    pub endpoint: String,
}

impl From<StorageProviderInfo> for StorageProviderResp {
    fn from(info: StorageProviderInfo) -> Self {
        Self {
            code: info.code,
            label: info.label,
            bucket: info.bucket,
            endpoint: info.endpoint,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct GetStorageResp {
    pub providers: Vec<StorageProviderResp>,
    pub default_provider: String,
}

impl From<StorageGetResult> for GetStorageResp {
    fn from(result: StorageGetResult) -> Self {
        Self {
            providers: result.providers.into_iter().map(StorageProviderResp::from).collect(),
            default_provider: result.default_provider,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct StorageObjectResp {
    pub provider: String,
    pub bucket: String,
    pub key: String,
    pub size: i64,
    pub etag: Option<String>,
    pub last_modified: Option<DateTime<Utc>>,
    pub storage_class: Option<String>,
    pub public_url: String,
}

impl From<StorageObjectItem> for StorageObjectResp {
    fn from(item: StorageObjectItem) -> Self {
        Self {
            provider: item.provider,
            bucket: item.bucket,
            key: item.key,
            size: item.size,
            etag: item.etag,
            last_modified: item.last_modified,
            storage_class: item.storage_class,
            public_url: item.public_url,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PageStorageResp {
    pub provider: StorageProviderResp,
    pub items: Vec<StorageObjectResp>,
    pub next_token: Option<String>,
    pub is_truncated: bool,
}

impl From<PageStorageObjectResult> for PageStorageResp {
    fn from(result: PageStorageObjectResult) -> Self {
        Self {
            provider: StorageProviderResp::from(result.provider),
            items: result.items.into_iter().map(StorageObjectResp::from).collect(),
            next_token: result.next_token,
            is_truncated: result.is_truncated,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SignStorageResp {
    pub signed_url: String,
}
