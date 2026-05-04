use domain_auth::{AuthToken, SigninTenantOption};
use neocrates::{helper::core::serde_helpers, serde::Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct SigninTenantOptionResp {
    #[serde(rename = "membershipId", serialize_with = "serde_helpers::serialize_i64")]
    pub membership_id: i64,
    #[serde(rename = "tenantId", serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    #[serde(rename = "tenantName")]
    pub tenant_name: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub status: i16,
    #[serde(rename = "userId", serialize_with = "serde_helpers::serialize_i64")]
    pub user_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    #[serde(rename = "roleIds", serialize_with = "serde_helpers::serialize_vec_i64")]
    pub role_ids: Vec<i64>,
    #[serde(rename = "roleNames")]
    pub role_names: Vec<String>,
    #[serde(rename = "roleCodes")]
    pub role_codes: Vec<String>,
}

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

#[derive(Debug, Clone, Serialize)]
pub struct AuthTokenResp {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
    #[serde(rename = "refreshExpiresAt")]
    pub refresh_expires_at: u64,
}

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
