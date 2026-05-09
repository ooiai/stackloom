use neocrates::{helper::core::serde_helpers, serde::Serialize};

/// Response for the current user's profile.
#[derive(Debug, Clone, Serialize)]
pub struct UserProfileResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub employee_no: Option<String>,
    pub job_title: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub tenant_name: String,
}

impl From<domain_base::UserProfileView> for UserProfileResp {
    fn from(value: domain_base::UserProfileView) -> Self {
        Self {
            id: value.id,
            username: value.username,
            nickname: value.nickname,
            email: value.email,
            phone: value.phone,
            avatar_url: value.avatar_url,
            display_name: value.display_name,
            employee_no: value.employee_no,
            job_title: value.job_title,
            tenant_id: value.tenant_id,
            tenant_name: value.tenant_name,
        }
    }
}
