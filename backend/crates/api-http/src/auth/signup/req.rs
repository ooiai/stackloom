use domain_auth::{AccountSignupCmd, RecoveryChannel, SendSignupCodeCmd};
use neocrates::response::error::AppError;
use neocrates::serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct SendSignupCodeReq {
    #[validate(length(min = 1))]
    pub channel: String,
    #[validate(length(min = 1, max = 100))]
    pub contact: String,
    #[validate(length(min = 1))]
    pub code: String,
}

impl TryFrom<SendSignupCodeReq> for SendSignupCodeCmd {
    type Error = AppError;

    fn try_from(req: SendSignupCodeReq) -> Result<Self, Self::Error> {
        Ok(Self {
            channel: RecoveryChannel::parse(req.channel.as_str())?,
            contact: req.contact,
            code: req.code,
        })
    }
}

/// Request body for self-service account signup.
///
/// In addition to the verified phone/email contact, the caller may provide an
/// optional nickname and tenant name used to initialize the first tenant.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct AccountSignupReq {
    #[validate(length(min = 1))]
    pub channel: String,
    #[validate(length(min = 1, max = 100))]
    pub contact: String,
    #[validate(length(min = 6, max = 6))]
    pub captcha: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(max = 100))]
    pub nickname: Option<String>,
    #[validate(length(max = 255))]
    pub tenant_name: Option<String>,
}

/// Convert the signup HTTP DTO into the domain command handled by auth.
impl TryFrom<AccountSignupReq> for AccountSignupCmd {
    type Error = AppError;

    fn try_from(req: AccountSignupReq) -> Result<Self, Self::Error> {
        Ok(Self {
            channel: RecoveryChannel::parse(req.channel.as_str())?,
            contact: req.contact,
            captcha: req.captcha,
            password: req.password,
            nickname: req.nickname,
            tenant_name: req.tenant_name,
        })
    }
}

/// Request body for invite-aware account signup.
///
/// The caller provides the same credential fields plus the invite code that
/// identifies the tenant they are joining.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct InviteSignupReq {
    #[validate(length(min = 1))]
    pub channel: String,
    #[validate(length(min = 1, max = 100))]
    pub contact: String,
    #[validate(length(min = 6, max = 6))]
    pub captcha: String,
    #[validate(length(min = 1))]
    pub password: String,
    #[validate(length(max = 100))]
    pub nickname: Option<String>,
    #[validate(length(min = 1))]
    pub invite_code: String,
}

/// Convert the invite-signup transport DTO into the domain command.
impl TryFrom<InviteSignupReq> for domain_auth::InviteSignupCmd {
    type Error = AppError;

    fn try_from(req: InviteSignupReq) -> Result<Self, Self::Error> {
        Ok(Self {
            channel: RecoveryChannel::parse(req.channel.as_str())?,
            contact: req.contact,
            captcha: req.captcha,
            password: req.password,
            nickname: req.nickname,
            invite_code: req.invite_code,
        })
    }
}
