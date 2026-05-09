use domain_base::TenantMemberView;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct TenantMemberResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub user_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub job_title: Option<String>,
    pub status: i16,
    pub is_tenant_admin: bool,
    pub joined_at: DateTime<Utc>,
}

impl From<TenantMemberView> for TenantMemberResp {
    fn from(v: TenantMemberView) -> Self {
        Self {
            id: v.id,
            user_id: v.user_id,
            username: v.username,
            nickname: v.nickname,
            email: v.email,
            avatar_url: v.avatar_url,
            display_name: v.display_name,
            job_title: v.job_title,
            status: v.status,
            is_tenant_admin: v.is_tenant_admin,
            joined_at: v.joined_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateMembersResp {
    pub items: Vec<TenantMemberResp>,
    pub total: i64,
}

impl PaginateMembersResp {
    pub fn new(items: Vec<TenantMemberResp>, total: i64) -> Self {
        Self { items, total }
    }
}
