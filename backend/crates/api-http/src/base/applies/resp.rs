use domain_base::TenantApplyView;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct TenantApplyResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub user_id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub tenant_name: String,
    pub tenant_slug: String,
    pub applicant_username: String,
    pub applicant_name: Option<String>,
    pub applicant_phone: Option<String>,
    pub applicant_email: Option<String>,
    pub applicant_avatar: Option<String>,
    pub user_status: i16,
    pub membership_status: i16,
    pub created_at: DateTime<Utc>,
}

impl From<TenantApplyView> for TenantApplyResp {
    fn from(view: TenantApplyView) -> Self {
        Self {
            id: view.id,
            user_id: view.user_id,
            tenant_id: view.tenant_id,
            tenant_name: view.tenant_name,
            tenant_slug: view.tenant_slug,
            applicant_username: view.applicant_username,
            applicant_name: view.applicant_name,
            applicant_phone: view.applicant_phone,
            applicant_email: view.applicant_email,
            applicant_avatar: view.applicant_avatar,
            user_status: view.user_status,
            membership_status: view.membership_status,
            created_at: view.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateTenantApplyResp {
    pub items: Vec<TenantApplyResp>,
    pub total: i64,
}

impl PaginateTenantApplyResp {
    pub fn new(items: Vec<TenantApplyResp>, total: i64) -> Self {
        Self { items, total }
    }
}
