use domain_auth::{AccountSigninCmd, QuerySigninTenantsCmd, RefreshAuthCmd};
use neocrates::{
    helper::core::serde_helpers,
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct QuerySigninTenantsReq {
    #[validate(length(min = 1, max = 50))]
    pub account: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(min = 1))]
    pub code: String,
}

impl From<QuerySigninTenantsReq> for QuerySigninTenantsCmd {
    fn from(req: QuerySigninTenantsReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
        }
    }
}

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

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RefreshTokenReq {
    #[serde(alias = "accessToken")]
    #[validate(length(min = 1))]
    pub access_token: String,
    #[serde(alias = "refreshToken")]
    #[validate(length(min = 1))]
    pub refresh_token: String,
}

impl From<RefreshTokenReq> for RefreshAuthCmd {
    fn from(req: RefreshTokenReq) -> Self {
        Self {
            access_token: req.access_token,
            refresh_token: req.refresh_token,
        }
    }
}
