use neocrates::{
    async_trait::async_trait,
    aws::sts_service::AwsStsVo,
    chrono::{DateTime, Utc},
    response::error::AppResult,
};

#[async_trait]
pub trait AwsStsService: Send + Sync {
    async fn get_sts(&self, uid: i64) -> AppResult<AwsStsVo>;
}

#[async_trait]
pub trait ObjectStorageService: Send + Sync {
    async fn put_object(&self, path: &str, data: Vec<u8>) -> AppResult<()>;

    async fn download_object(&self, path: &str) -> AppResult<Vec<u8>>;

    fn normalize_object_path(&self, raw_path: &str) -> Option<String>;

    fn build_public_url(&self, path: &str) -> String;

    async fn get_signed_url(&self, path: &str, expires_in: u64) -> AppResult<String>;

    async fn download_object_via_signed_url(
        &self,
        path: &str,
        expires_in: u64,
    ) -> AppResult<Vec<u8>>;

    async fn put_object_via_http(&self, path: &str, data: Vec<u8>) -> AppResult<()>;
}

#[derive(Debug, Clone)]
pub struct StorageProviderInfo {
    pub code: String,
    pub label: String,
    pub bucket: String,
    pub endpoint: String,
}

#[derive(Debug, Clone)]
pub struct StorageGetResult {
    pub providers: Vec<StorageProviderInfo>,
    pub default_provider: String,
}

#[derive(Debug, Clone)]
pub struct PageStorageObjectCmd {
    pub provider: String,
    pub bucket: Option<String>,
    pub prefix: Option<String>,
    pub continuation_token: Option<String>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct StorageObjectItem {
    pub provider: String,
    pub bucket: String,
    pub key: String,
    pub size: i64,
    pub etag: Option<String>,
    pub last_modified: Option<DateTime<Utc>>,
    pub storage_class: Option<String>,
    pub public_url: String,
}

#[derive(Debug, Clone)]
pub struct PageStorageObjectResult {
    pub provider: StorageProviderInfo,
    pub items: Vec<StorageObjectItem>,
    pub next_token: Option<String>,
    pub is_truncated: bool,
}

#[derive(Debug, Clone)]
pub struct SignStorageObjectCmd {
    pub provider: String,
    pub bucket: Option<String>,
    pub key: String,
    pub expires_in: Option<u64>,
}

#[async_trait]
pub trait StorageBrowseService: Send + Sync {
    async fn get(&self) -> AppResult<StorageGetResult>;

    async fn page(&self, cmd: PageStorageObjectCmd) -> AppResult<PageStorageObjectResult>;

    async fn sign(&self, cmd: SignStorageObjectCmd) -> AppResult<String>;
}
