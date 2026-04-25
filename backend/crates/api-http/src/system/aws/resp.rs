use neocrates::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AwsSignedUrlResp {
    pub signed_url: String,
}

#[derive(Debug, Serialize)]
pub struct AwsUploadRemoteImageResp {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct AwsUploadRemoteObjectResp {
    pub path: String,
}
