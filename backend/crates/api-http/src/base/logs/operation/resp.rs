use domain_base::OperationLog;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
    serde_json::Value,
};

#[derive(Debug, Clone, Serialize)]
pub struct OperationLogResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub operator_id: Option<i64>,
    pub module: String,
    pub biz_type: String,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub biz_id: Option<i64>,
    pub operation: String,
    pub summary: String,
    pub result: i16,
    pub before_snapshot: Value,
    pub after_snapshot: Value,
    pub trace_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<OperationLog> for OperationLogResp {
    fn from(log: OperationLog) -> Self {
        Self {
            id: log.id,
            tenant_id: log.tenant_id,
            operator_id: log.operator_id,
            module: log.module,
            biz_type: log.biz_type,
            biz_id: log.biz_id,
            operation: log.operation,
            summary: log.summary,
            result: log.result,
            before_snapshot: log.before_snapshot,
            after_snapshot: log.after_snapshot,
            trace_id: log.trace_id,
            created_at: log.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateOperationLogResp {
    pub items: Vec<OperationLogResp>,
    pub total: usize,
}

impl PaginateOperationLogResp {
    pub fn new(items: Vec<OperationLogResp>, total: usize) -> Self {
        Self { items, total }
    }
}
