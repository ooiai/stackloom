use domain_auth::AccountSignupCmd;
use neocrates::serde::Deserialize;
use validator::Validate;

/// Request body for self-service account signup.
///
/// In addition to account credentials and captcha data, the caller may provide
/// an optional nickname and tenant name used to initialize the first tenant.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct AccountSignupReq {
    #[validate(length(min = 1, max = 50))]
    pub account: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(min = 1))]
    pub code: String,
    #[validate(length(max = 100))]
    pub nickname: Option<String>,
    #[validate(length(max = 255))]
    pub tenant_name: Option<String>,
}

/// Convert the signup HTTP DTO into the domain command handled by auth.
impl From<AccountSignupReq> for AccountSignupCmd {
    fn from(req: AccountSignupReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
            nickname: req.nickname,
            tenant_name: req.tenant_name,
        }
    }
}

/// Request body for invite-aware account signup.
///
/// The caller provides the same credential fields plus the invite code that
/// identifies the tenant they are joining.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct InviteSignupReq {
    #[validate(length(min = 1, max = 50))]
    pub account: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(min = 1))]
    pub code: String,
    #[validate(length(max = 100))]
    pub nickname: Option<String>,
    #[validate(length(min = 1))]
    pub invite_code: String,
}

/// Convert the invite-signup transport DTO into the domain command.
impl From<InviteSignupReq> for domain_auth::InviteSignupCmd {
    fn from(req: InviteSignupReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
            nickname: req.nickname,
            invite_code: req.invite_code,
        }
    }
}
