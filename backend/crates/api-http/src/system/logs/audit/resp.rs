use domain_system::AuditLog;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
    serde_json::Value,
};

#[derive(Debug, Clone, Serialize)]
pub struct AuditLogResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub trace_id: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub operator_id: Option<i64>,
    pub target_type: String,
    pub target_id: String,
    pub action: String,
    pub result: String,
    pub reason: Option<String>,
    pub before_data: Value,
    pub after_data: Value,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<AuditLog> for AuditLogResp {
    fn from(log: AuditLog) -> Self {
        Self {
            id: log.id,
            trace_id: log.trace_id,
            tenant_id: log.tenant_id,
            operator_id: log.operator_id,
            target_type: log.target_type,
            target_id: log.target_id,
            action: log.action,
            result: log.result,
            reason: log.reason,
            before_data: log.before_data,
            after_data: log.after_data,
            ip: log.ip,
            user_agent: log.user_agent,
            created_at: log.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateAuditLogResp {
    pub items: Vec<AuditLogResp>,
    pub total: usize,
}

impl PaginateAuditLogResp {
    pub fn new(items: Vec<AuditLogResp>, total: usize) -> Self {
        Self { items, total }
    }
}
