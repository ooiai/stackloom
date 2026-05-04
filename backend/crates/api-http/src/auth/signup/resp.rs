use domain_auth::SignupResult;
use neocrates::serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SignupAccountResp {
    pub account: String,
    pub username: String,
    #[serde(rename = "tenantName")]
    pub tenant_name: String,
    #[serde(rename = "tenantSlug")]
    pub tenant_slug: String,
    #[serde(rename = "signinPath")]
    pub signin_path: String,
}

impl From<SignupResult> for SignupAccountResp {
    fn from(value: SignupResult) -> Self {
        Self {
            account: value.account,
            username: value.username,
            tenant_name: value.tenant_name,
            tenant_slug: value.tenant_slug,
            signin_path: "/signin".to_string(),
        }
    }
}
