use chrono::{DateTime, Utc};
use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    SystemLog,
    system_log::{SystemLogFilter, SystemLogPageQuery},
};

#[async_trait]
pub trait SystemLogRepository: Send + Sync {
    async fn create(&self, log: &SystemLog) -> AppResult<SystemLog>;

    async fn page(&self, query: &SystemLogPageQuery) -> AppResult<(Vec<SystemLog>, i64)>;

    async fn list(&self, filter: &SystemLogFilter) -> AppResult<Vec<SystemLog>>;

    async fn delete_by_created_before(&self, cutoff: DateTime<Utc>) -> AppResult<i64>;
}
