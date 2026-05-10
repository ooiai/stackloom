use domain_system::PageAuditLogCmd;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageAuditLogReq {
    pub trace_id: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub operator_id: Option<i64>,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub action: Option<String>,
    pub result: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageAuditLogReq> for PageAuditLogCmd {
    fn from(req: PageAuditLogReq) -> Self {
        Self {
            trace_id: req.trace_id,
            tenant_id: req.tenant_id,
            operator_id: req.operator_id,
            target_type: req.target_type,
            target_id: req.target_id,
            action: req.action,
            result: req.result,
            created_at_start: req.created_at_start,
            created_at_end: req.created_at_end,
            limit: req.limit,
            offset: req.offset,
        }
    }
}
