use domain_system::PageSystemLogCmd;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageSystemLogReq {
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub operator_id: Option<i64>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: Option<i32>,
    pub result: Option<String>,
    pub error_code: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageSystemLogReq> for PageSystemLogCmd {
    fn from(req: PageSystemLogReq) -> Self {
        Self {
            trace_id: req.trace_id,
            request_id: req.request_id,
            tenant_id: req.tenant_id,
            operator_id: req.operator_id,
            method: req.method,
            path: req.path,
            module: req.module,
            action: req.action,
            status_code: req.status_code,
            result: req.result,
            error_code: req.error_code,
            created_at_start: req.created_at_start,
            created_at_end: req.created_at_end,
            limit: req.limit,
            offset: req.offset,
        }
    }
}
