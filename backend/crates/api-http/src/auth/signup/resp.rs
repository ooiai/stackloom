use domain_auth::AccountSignupResult;
use neocrates::serde::Serialize;

/// HTTP response returned after self-service signup succeeds.
///
/// The response echoes the created account identity together with the tenant
/// information the frontend can use to guide the user into the signin page.
#[derive(Debug, Clone, Serialize)]
pub struct AccountSignupResp {
    pub account: String,
    pub username: String,
    #[serde(rename = "tenantName")]
    pub tenant_name: String,
    #[serde(rename = "tenantSlug")]
    pub tenant_slug: String,
    #[serde(rename = "signinPath")]
    pub signin_path: String,
}

/// Map the domain signup result into the public HTTP response contract.
impl From<AccountSignupResult> for AccountSignupResp {
    fn from(value: AccountSignupResult) -> Self {
        Self {
            account: value.account,
            username: value.username,
            tenant_name: value.tenant_name,
            tenant_slug: value.tenant_slug,
            signin_path: "/signin".to_string(),
        }
    }
}
