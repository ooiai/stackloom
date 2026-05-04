use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    AccountSigninCmd, AuthToken, QuerySigninTenantsCmd, RefreshAuthCmd, SigninTenantOption,
    SignupCmd, SignupResult,
};

#[async_trait]
pub trait AuthService: Send + Sync {
    async fn query_signin_tenants(
        &self,
        cmd: QuerySigninTenantsCmd,
    ) -> AppResult<Vec<SigninTenantOption>>;

    async fn account_signin(&self, cmd: AccountSigninCmd) -> AppResult<AuthToken>;

    async fn refresh_token(&self, cmd: RefreshAuthCmd) -> AppResult<AuthToken>;

    async fn signup(&self, cmd: SignupCmd) -> AppResult<SignupResult>;

    async fn logout(&self, uid: i64) -> AppResult<()>;
}
