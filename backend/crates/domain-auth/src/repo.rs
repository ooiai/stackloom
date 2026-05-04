use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{AuthTenantConflict, AuthUserAccount, SigninTenantOption, SignupBundle};

#[async_trait]
pub trait AuthRepository: Send + Sync {
    async fn find_user_by_account(&self, account: &str) -> AppResult<Option<AuthUserAccount>>;

    async fn find_tenant_by_slug(&self, slug: &str) -> AppResult<Option<AuthTenantConflict>>;

    async fn find_tenant_by_name_or_slug(
        &self,
        name: &str,
        slug: &str,
    ) -> AppResult<Option<AuthTenantConflict>>;

    async fn list_signin_tenants(&self, user_id: i64) -> AppResult<Vec<SigninTenantOption>>;

    async fn create_signup_bundle(&self, bundle: &SignupBundle) -> AppResult<()>;
}
