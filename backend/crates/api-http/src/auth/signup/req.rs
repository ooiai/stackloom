use domain_auth::SignupCmd;
use neocrates::serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct SignupAccountReq {
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

impl From<SignupAccountReq> for SignupCmd {
    fn from(req: SignupAccountReq) -> Self {
        Self {
            account: req.account,
            password: req.password,
            code: req.code,
            nickname: req.nickname,
            tenant_name: req.tenant_name,
        }
    }
}
