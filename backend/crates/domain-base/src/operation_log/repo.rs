use chrono::{DateTime, Utc};
use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    OperationLog,
    operation_log::{OperationLogListQuery, OperationLogPageQuery},
};

#[async_trait]
pub trait OperationLogRepository: Send + Sync {
    /// Create a new operation log.
    async fn create(&self, operation_log: &OperationLog) -> AppResult<OperationLog>;

    /// Get a paginated list of operation logs.
    async fn page(&self, query: &OperationLogPageQuery) -> AppResult<(Vec<OperationLog>, i64)>;

    /// Get a filtered list of operation logs.
    async fn list(&self, query: &OperationLogListQuery) -> AppResult<Vec<OperationLog>>;

    /// Delete operation logs created before the specified timestamp.
    async fn delete_by_created_before(&self, cutoff: DateTime<Utc>) -> AppResult<i64>;
}
