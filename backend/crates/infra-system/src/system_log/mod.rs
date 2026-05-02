pub mod repo;
pub mod service;

pub use repo::SqlxSystemLogRepository;
pub use service::SystemLogServiceImpl;

use chrono::{DateTime, Utc};
use domain_system::SystemLog;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct SystemLogRow {
    pub id: i64,
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: String,
    pub path: String,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: i32,
    pub latency_ms: i64,
    pub result: String,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub ext: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

impl From<SystemLogRow> for SystemLog {
    fn from(row: SystemLogRow) -> Self {
        Self {
            id: row.id,
            trace_id: row.trace_id,
            request_id: row.request_id,
            tenant_id: row.tenant_id,
            operator_id: row.operator_id,
            method: row.method,
            path: row.path,
            module: row.module,
            action: row.action,
            status_code: row.status_code,
            latency_ms: row.latency_ms,
            result: row.result,
            error_code: row.error_code,
            error_message: row.error_message,
            ip: row.ip,
            user_agent: row.user_agent,
            ext: row.ext,
            created_at: row.created_at,
        }
    }
}
