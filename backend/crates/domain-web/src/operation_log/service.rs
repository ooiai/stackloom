use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateOperationLogCmd, ListOperationLogCmd, OperationLog, PageOperationLogCmd};

#[async_trait]
pub trait OperationLogService: Send + Sync {
    /// Create a new operation log.
    async fn create(&self, cmd: CreateOperationLogCmd) -> AppResult<OperationLog>;

    /// Get a paginated list of operation logs.
    async fn page(&self, cmd: PageOperationLogCmd) -> AppResult<(Vec<OperationLog>, i64)>;

    /// Get a filtered list of operation logs.
    async fn list(&self, cmd: ListOperationLogCmd) -> AppResult<Vec<OperationLog>>;
}
