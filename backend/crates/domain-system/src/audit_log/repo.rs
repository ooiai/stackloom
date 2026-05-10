use chrono::{DateTime, Utc};
use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    AuditLog,
    audit_log::{AuditLogFilter, AuditLogPageQuery},
};

#[async_trait]
pub trait AuditLogRepository: Send + Sync {
    async fn create(&self, log: &AuditLog) -> AppResult<AuditLog>;

    async fn page(&self, query: &AuditLogPageQuery) -> AppResult<(Vec<AuditLog>, i64)>;

    async fn list(&self, filter: &AuditLogFilter) -> AppResult<Vec<AuditLog>>;

    async fn delete_by_created_before(&self, cutoff: DateTime<Utc>) -> AppResult<i64>;
}
