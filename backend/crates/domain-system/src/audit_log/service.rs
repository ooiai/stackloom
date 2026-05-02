use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{AuditLog, CreateAuditLogCmd, ListAuditLogCmd, PageAuditLogCmd};

#[async_trait]
pub trait AuditLogService: Send + Sync {
    async fn create(&self, cmd: CreateAuditLogCmd) -> AppResult<AuditLog>;

    async fn page(&self, cmd: PageAuditLogCmd) -> AppResult<(Vec<AuditLog>, i64)>;

    async fn list(&self, cmd: ListAuditLogCmd) -> AppResult<Vec<AuditLog>>;
}
