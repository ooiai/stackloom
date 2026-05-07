use neocrates::{helper::core::serde_helpers, serde::Serialize};

/// Response for the current user's profile.
#[derive(Debug, Clone, Serialize)]
pub struct UserProfileResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub tenant_name: String,
}
