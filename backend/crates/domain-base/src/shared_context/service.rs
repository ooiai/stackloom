use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::shared_context::{SharedHeaderContext, UpdateProfileCmd, UserProfileView};

#[async_trait]
pub trait SharedContextService: Send + Sync {
    /// Load shared header context by user and tenant.
    async fn get_header_context(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<SharedHeaderContext>;

    /// Load user profile data for account settings by user and tenant.
    async fn get_profile(&self, user_id: i64, tenant_id: i64) -> AppResult<UserProfileView>;

    /// Update user profile and membership fields for account settings.
    async fn update_profile(
        &self,
        user_id: i64,
        tenant_id: i64,
        cmd: UpdateProfileCmd,
    ) -> AppResult<UserProfileView>;

    /// Invalidate cached shared context for all users of a tenant.
    async fn invalidate_by_tenant(&self, tenant_id: i64) -> AppResult<()>;

    /// Invalidate cached shared context for one user in a tenant.
    async fn invalidate_by_user_tenant(&self, user_id: i64, tenant_id: i64) -> AppResult<()>;
}
