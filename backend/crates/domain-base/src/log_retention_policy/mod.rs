use chrono::{DateTime, Utc};

pub struct LogRetentionPolicy {
    pub id: i64,
    pub log_type: String,
    pub retention_days: Option<i32>,
    pub last_cleanup_at: Option<DateTime<Utc>>,
}

pub struct UpdateLogRetentionPolicyCmd {
    pub log_type: String,
    pub retention_days: Option<i32>,
}

pub mod repo;
