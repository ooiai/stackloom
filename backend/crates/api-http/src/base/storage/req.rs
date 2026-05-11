use domain_system::aws::{PageStorageObjectCmd, SignStorageObjectCmd};
use neocrates::serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetStorageReq {}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct PageStorageReq {
    #[validate(length(min = 1, max = 32))]
    pub provider: String,
    #[validate(length(max = 128))]
    pub bucket: Option<String>,
    #[validate(length(max = 512))]
    pub prefix: Option<String>,
    #[validate(length(max = 2048))]
    pub continuation_token: Option<String>,
    #[validate(range(min = 1, max = 100))]
    pub page_size: Option<i32>,
}

impl From<PageStorageReq> for PageStorageObjectCmd {
    fn from(req: PageStorageReq) -> Self {
        Self {
            provider: req.provider,
            bucket: req.bucket,
            prefix: req.prefix,
            continuation_token: req.continuation_token,
            page_size: req.page_size,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct SignStorageReq {
    #[validate(length(min = 1, max = 32))]
    pub provider: String,
    #[validate(length(max = 128))]
    pub bucket: Option<String>,
    #[validate(length(min = 1, max = 1024))]
    pub key: String,
    #[validate(range(min = 60, max = 86_400))]
    pub expires_in: Option<u64>,
}

impl From<SignStorageReq> for SignStorageObjectCmd {
    fn from(req: SignStorageReq) -> Self {
        Self {
            provider: req.provider,
            bucket: req.bucket,
            key: req.key,
            expires_in: req.expires_in,
        }
    }
}
