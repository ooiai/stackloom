use domain_auth::{AuthToken, SigninTenantOption};
use neocrates::{helper::core::serde_helpers, serde::Serialize};

/// HTTP response item that describes one available tenant membership
/// during the signin preflight step.
#[derive(Debug, Clone, Serialize)]
pub struct SigninTenantOptionResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub membership_id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub tenant_name: String,
    pub display_name: Option<String>,
    pub status: i16,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub user_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_vec_i64")]
    pub role_ids: Vec<i64>,
    pub role_names: Vec<String>,
    pub role_codes: Vec<String>,
}

/// Map the domain projection returned by the auth service into the HTTP DTO.
impl From<SigninTenantOption> for SigninTenantOptionResp {
    fn from(value: SigninTenantOption) -> Self {
        Self {
            membership_id: value.membership_id,
            tenant_id: value.tenant_id,
            tenant_name: value.tenant_name,
            display_name: value.display_name,
            status: value.status,
            user_id: value.user_id,
            username: value.username,
            nickname: value.nickname,
            role_ids: value.role_ids,
            role_names: value.role_names,
            role_codes: value.role_codes,
        }
    }
}

/// HTTP response returned after signin or token refresh succeeds.
#[derive(Debug, Clone, Serialize)]
pub struct AuthTokenResp {
    pub access_token: String,
    pub expires_at: u64,
    pub refresh_token: String,
    pub refresh_expires_at: u64,
}

/// Map the domain auth token into the response contract expected by the client.
impl From<AuthToken> for AuthTokenResp {
    fn from(value: AuthToken) -> Self {
        Self {
            access_token: value.access_token,
            expires_at: value.expires_at,
            refresh_token: value.refresh_token,
            refresh_expires_at: value.refresh_expires_at,
        }
    }
}
