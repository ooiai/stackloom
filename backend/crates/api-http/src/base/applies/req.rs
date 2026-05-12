use domain_base::{
    ApproveTenantApplyCmd, BanTenantApplyCmd, PageTenantApplyCmd, RejectTenantApplyCmd,
};
use neocrates::{helper::core::serde_helpers, serde::Deserialize};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageTenantApplyReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl From<PageTenantApplyReq> for PageTenantApplyCmd {
    fn from(req: PageTenantApplyReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct ApproveTenantApplyReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<ApproveTenantApplyReq> for ApproveTenantApplyCmd {
    fn from(req: ApproveTenantApplyReq) -> Self {
        Self { id: req.id }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RejectTenantApplyReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<RejectTenantApplyReq> for RejectTenantApplyCmd {
    fn from(req: RejectTenantApplyReq) -> Self {
        Self { id: req.id }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct BanTenantApplyReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<BanTenantApplyReq> for BanTenantApplyCmd {
    fn from(req: BanTenantApplyReq) -> Self {
        Self { id: req.id }
    }
}
