use neocrates::serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct GetLogRetentionPolicyReq {
    pub log_type: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLogRetentionPolicyReq {
    pub log_type: String,
    pub retention_days: Option<i32>,
}
