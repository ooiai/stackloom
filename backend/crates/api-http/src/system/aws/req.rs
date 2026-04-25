use neocrates::serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CosStsReq {}

#[derive(Debug, Deserialize, Validate)]
pub struct AwsSignedUrlReq {
    #[validate(length(min = 1, max = 2048))]
    pub path: String,
    #[validate(range(min = 60, max = 86_400))]
    pub expires_in: Option<u64>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AwsUploadRemoteImageReq {
    #[validate(length(min = 1, max = 2048))]
    pub url: String,
    #[validate(length(max = 128))]
    pub folder: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AwsUploadRemoteObjectReq {
    #[validate(length(min = 1, max = 2048))]
    pub url: String,
    #[validate(length(max = 128))]
    pub folder: Option<String>,
    #[validate(length(max = 32))]
    pub resource_type: Option<String>,
}
