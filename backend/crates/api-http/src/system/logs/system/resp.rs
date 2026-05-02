use domain_system::SystemLog;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
    serde_json::Value,
};

#[derive(Debug, Clone, Serialize)]
pub struct SystemLogResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
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
    pub ext: Value,
    pub created_at: DateTime<Utc>,
}

impl From<SystemLog> for SystemLogResp {
    fn from(log: SystemLog) -> Self {
        Self {
            id: log.id,
            trace_id: log.trace_id,
            request_id: log.request_id,
            tenant_id: log.tenant_id,
            operator_id: log.operator_id,
            method: log.method,
            path: log.path,
            module: log.module,
            action: log.action,
            status_code: log.status_code,
            latency_ms: log.latency_ms,
            result: log.result,
            error_code: log.error_code,
            error_message: log.error_message,
            ip: log.ip,
            user_agent: log.user_agent,
            ext: log.ext,
            created_at: log.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateSystemLogResp {
    pub items: Vec<SystemLogResp>,
    pub total: usize,
}

impl PaginateSystemLogResp {
    pub fn new(items: Vec<SystemLogResp>, total: usize) -> Self {
        Self { items, total }
    }
}
