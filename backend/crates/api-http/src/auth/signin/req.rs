use domain_auth::{AccountSigninCmd, QuerySigninTenantsCmd, RefreshAuthCmd};
use neocrates::{
    helper::core::serde_helpers,
    serde::Deserialize,
};
use validator::Validate;

/// Request body for the first signin step.
///
/// The client provides account credentials and the slider captcha code,
/// and the backend responds with the tenant memberships that can be used
/// for the final signin step.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct QuerySigninTenantsReq {
    #[validate(length(min = 1, max = 50))]
    pub account: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(min = 1))]
    pub code: String,
}

/// Convert the HTTP DTO into the domain command consumed by the auth service.
impl From<QuerySigninTenantsReq> for QuerySigninTenantsCmd {
    fn from(req: QuerySigninTenantsReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
        }
    }
}

/// Request body for the final signin step.
///
/// After the frontend chooses one tenant membership from the preflight query,
/// it sends the selected membership and tenant ids together with the same
/// credentials and captcha payload.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct AccountSigninReq {
    #[validate(length(min = 1, max = 50))]
    pub account: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(min = 1))]
    pub code: String,
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub membership_id: i64,
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub tenant_id: i64,
}

/// Convert the final signin request into the corresponding domain command.
impl From<AccountSigninReq> for AccountSigninCmd {
    fn from(req: AccountSigninReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
            membership_id: req.membership_id,
            tenant_id: req.tenant_id,
        }
    }
}

/// Request body for token refresh.
///
/// The caller must provide the currently issued access token and refresh token
/// so the domain service can rotate them together.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RefreshTokenReq {
    #[serde(alias = "accessToken")]
    #[validate(length(min = 1))]
    pub access_token: String,
    #[serde(alias = "refreshToken")]
    #[validate(length(min = 1))]
    pub refresh_token: String,
}

/// Convert the refresh request into the domain refresh command.
impl From<RefreshTokenReq> for RefreshAuthCmd {
    fn from(req: RefreshTokenReq) -> Self {
        Self {
            access_token: req.access_token,
            refresh_token: req.refresh_token,
        }
    }
}
