pub mod repo;
pub mod service;

pub use repo::SqlxAuditLogRepository;
pub use service::AuditLogServiceImpl;

use chrono::{DateTime, Utc};
use domain_system::AuditLog;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct AuditLogRow {
    pub id: i64,
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: String,
    pub target_id: String,
    pub action: String,
    pub result: String,
    pub reason: Option<String>,
    pub before_data: serde_json::Value,
    pub after_data: serde_json::Value,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<AuditLogRow> for AuditLog {
    fn from(row: AuditLogRow) -> Self {
        Self {
            id: row.id,
            trace_id: row.trace_id,
            tenant_id: row.tenant_id,
            operator_id: row.operator_id,
            target_type: row.target_type,
            target_id: row.target_id,
            action: row.action,
            result: row.result,
            reason: row.reason,
            before_data: row.before_data,
            after_data: row.after_data,
            ip: row.ip,
            user_agent: row.user_agent,
            created_at: row.created_at,
        }
    }
}
