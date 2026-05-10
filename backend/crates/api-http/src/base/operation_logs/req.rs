use domain_base::PageOperationLogCmd;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageOperationLogReq {
    pub keyword: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub operator_id: Option<i64>,
    pub module: Option<String>,
    pub biz_type: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub biz_id: Option<i64>,
    pub operation: Option<String>,
    pub result: Option<i16>,
    pub trace_id: Option<String>,
    pub created_from: Option<DateTime<Utc>>,
    pub created_to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageOperationLogReq> for PageOperationLogCmd {
    fn from(req: PageOperationLogReq) -> Self {
        Self {
            keyword: req.keyword,
            tenant_id: req.tenant_id,
            operator_id: req.operator_id,
            module: req.module,
            biz_type: req.biz_type,
            biz_id: req.biz_id,
            operation: req.operation,
            result: req.result,
            trace_id: req.trace_id,
            created_from: req.created_from,
            created_to: req.created_to,
            limit: req.limit,
            offset: req.offset,
        }
    }
}
