use neocrates::chrono::{DateTime, Utc};
use neocrates::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct LogRetentionPolicyResp {
    pub log_type: String,
    pub retention_days: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_cleanup_at: Option<DateTime<Utc>>,
}
