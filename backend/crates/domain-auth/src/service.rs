use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    AccountSigninCmd, AccountSignupCmd, AccountSignupResult, AuthToken, QuerySigninTenantsCmd,
    RefreshAuthCmd, SigninTenantOption,
};

/// Domain service contract for auth flows.
///
/// The service coordinates business rules for two-step signin, self-service
/// signup, token refresh, and logout without exposing infra details to callers.
#[async_trait]
pub trait AuthService: Send + Sync {
    /// Execute the first signin step.
    ///
    /// The implementation validates account credentials and captcha data, then
    /// returns the tenant memberships that the caller can choose from.
    async fn query_signin_tenants(
        &self,
        cmd: QuerySigninTenantsCmd,
    ) -> AppResult<Vec<SigninTenantOption>>;

    /// Execute the final signin step and issue tokens.
    ///
    /// The selected membership determines which tenant context and role set are
    /// embedded into the generated auth token payload.
    async fn account_signin(&self, cmd: AccountSigninCmd) -> AppResult<AuthToken>;

    /// Refresh the current auth token pair.
    ///
    /// Implementations should validate the provided token pair and rotate it
    /// according to the configured auth/token strategy.
    async fn refresh_token(&self, cmd: RefreshAuthCmd) -> AppResult<AuthToken>;

    /// Execute self-service signup.
    ///
    /// A successful signup creates the user, tenant, default role, and initial
    /// membership together, then returns the created account summary.
    async fn account_signup(&self, cmd: AccountSignupCmd) -> AppResult<AccountSignupResult>;

    /// Logout the current user.
    ///
    /// Implementations usually revoke or delete the tokens associated with the
    /// supplied user id.
    async fn logout(&self, uid: i64) -> AppResult<()>;
}
