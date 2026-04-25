use neocrates::{async_trait::async_trait, aws::sts_service::AwsStsVo, response::error::AppResult};

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
