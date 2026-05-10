use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::log_retention_policy::LogRetentionPolicy;

#[async_trait]
pub trait LogRetentionPolicyRepository: Send + Sync {
    async fn get(&self, log_type: &str) -> AppResult<Option<LogRetentionPolicy>>;
    async fn update(&self, log_type: &str, retention_days: Option<i32>) -> AppResult<LogRetentionPolicy>;
    async fn list(&self) -> AppResult<Vec<LogRetentionPolicy>>;
}
