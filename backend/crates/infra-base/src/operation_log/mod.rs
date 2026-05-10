pub mod repo;
pub mod service;

pub use repo::SqlxOperationLogRepository;
pub use service::OperationLogServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::OperationLog;
use serde_json::Value;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct OperationLogRow {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: String,
    pub biz_type: String,
    pub biz_id: Option<i64>,
    pub operation: String,
    pub summary: String,
    pub result: i16,
    pub before_snapshot: Value,
    pub after_snapshot: Value,
    pub trace_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<OperationLogRow> for OperationLog {
    fn from(row: OperationLogRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            operator_id: row.operator_id,
            module: row.module,
            biz_type: row.biz_type,
            biz_id: row.biz_id,
            operation: row.operation,
            summary: row.summary,
            result: row.result,
            before_snapshot: row.before_snapshot,
            after_snapshot: row.after_snapshot,
            trace_id: row.trace_id,
            created_at: row.created_at,
        }
    }
}
