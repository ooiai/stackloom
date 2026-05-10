use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    AccountSignupBundle, AuthTenantConflict, AuthUserAccount, RecoveryChannel, SigninTenantOption,
};

/// Repository contract for auth-related persistence operations.
///
/// This abstraction isolates the domain service from storage details while
/// still exposing the exact reads and writes required by signin and signup.
#[async_trait]
pub trait AuthRepository: Send + Sync {
    /// Find one user account by login identifier.
    ///
    /// Implementations should support the account formats accepted by signin,
    /// which currently means username or phone number.
    async fn find_user_by_account(&self, account: &str) -> AppResult<Option<AuthUserAccount>>;

    /// Find one user account by id.
    async fn find_user_by_id(&self, user_id: i64) -> AppResult<Option<AuthUserAccount>>;

    /// Find one tenant by slug.
    ///
    /// This is mainly used when generating or checking tenant slugs during
    /// self-service signup.
    async fn find_tenant_by_slug(&self, slug: &str) -> AppResult<Option<AuthTenantConflict>>;

    /// Find one tenant by either display name or slug.
    ///
    /// Signup uses this method to reject tenant names/slugs that would collide
    /// with existing tenant records.
    async fn find_tenant_by_name_or_slug(
        &self,
        name: &str,
        slug: &str,
    ) -> AppResult<Option<AuthTenantConflict>>;

    /// List available tenant memberships for the specified user.
    ///
    /// The signin flow is intentionally split into two steps, so the service can
    /// first return all tenant memberships and role information before the user
    /// chooses the final membership used to issue tokens.
    async fn list_signin_tenants(&self, user_id: i64) -> AppResult<Vec<SigninTenantOption>>;

    /// Persist the full signup aggregate in one transaction.
    ///
    /// Implementations should treat the bundle as an atomic write so that user,
    /// tenant, membership, and membership-role binding stay consistent.
    async fn create_account_signup_bundle(&self, bundle: &AccountSignupBundle) -> AppResult<()>;

    /// Find one user account by channel-specific identity (phone or email).
    async fn find_user_by_channel_account(
        &self,
        channel: RecoveryChannel,
        account: &str,
    ) -> AppResult<Option<AuthUserAccount>>;

    /// Update the password hash for a specific user.
    async fn update_user_password_hash(&self, user_id: i64, password_hash: &str) -> AppResult<()>;
}
