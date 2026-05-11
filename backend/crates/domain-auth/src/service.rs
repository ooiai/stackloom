use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    AccountSigninCmd, AccountSignupCmd, AccountSignupResult, AuthToken, ChangePasswordCmd,
    InviteSignupCmd, QuerySigninTenantsCmd, RefreshAuthCmd, ResetPasswordCmd,
    SendPasswordResetCodeCmd, SendSignupCodeCmd, SigninTenantOption, SwitchTenantAuthCmd,
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

    /// Switch the current authenticated session into another active tenant
    /// membership of the same user and issue a fresh token pair.
    async fn switch_tenant_auth(&self, cmd: SwitchTenantAuthCmd) -> AppResult<AuthToken>;

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

    /// Send a signup captcha to the selected verification channel.
    async fn send_signup_code(&self, cmd: SendSignupCodeCmd) -> AppResult<()>;

    /// Execute invite-aware signup.
    ///
    /// A successful invite signup creates the user account plus a membership for
    /// the tenant resolved from the invite code, without creating a new tenant.
    async fn invite_signup(&self, cmd: InviteSignupCmd) -> AppResult<AccountSignupResult>;

    /// Logout the current user.
    ///
    /// Implementations usually revoke or delete the tokens associated with the
    /// supplied user id.
    async fn logout(&self, uid: i64) -> AppResult<()>;

    /// Send a password reset captcha to the selected recovery channel.
    async fn send_password_reset_code(&self, cmd: SendPasswordResetCodeCmd) -> AppResult<()>;

    /// Reset account password by validating recovery captcha.
    async fn reset_password(&self, cmd: ResetPasswordCmd) -> AppResult<()>;

    /// Change password for the current authenticated user.
    async fn change_password(&self, uid: i64, cmd: ChangePasswordCmd) -> AppResult<()>;
}
