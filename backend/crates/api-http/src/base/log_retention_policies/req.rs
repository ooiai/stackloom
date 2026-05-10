use neocrates::serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct UpdateLogRetentionPolicyReq {
    pub retention_days: Option<i32>,
}
