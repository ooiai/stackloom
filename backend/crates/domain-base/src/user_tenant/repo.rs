use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{UserTenant, user_tenant::{TenantMemberPageQuery, TenantMemberView, UserTenantPageQuery}};

#[async_trait]
pub trait UserTenantRepository: Send + Sync {
    /// Create a new UserTenant.
    async fn create(&self, user_tenant: &UserTenant) -> AppResult<UserTenant>;

    /// Find a UserTenant by ID.
    async fn find_by_id(&self, id: i64) -> AppResult<Option<UserTenant>>;

    /// Get a paginated list of user_tenants.
    async fn page(&self, query: &UserTenantPageQuery) -> AppResult<(Vec<UserTenant>, i64)>;

    /// Get a paginated list of tenant members joined with user data.
    async fn page_members_by_tenant(
        &self,
        query: &TenantMemberPageQuery,
    ) -> AppResult<(Vec<TenantMemberView>, i64)>;

    /// Update an existing UserTenant.
    async fn update(&self, user_tenant: &UserTenant) -> AppResult<UserTenant>;

    /// Batch soft delete UserTenants by IDs.
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete UserTenants by IDs.
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Update the status of a user_tenant record by ID.
    async fn update_status(&self, id: i64, status: i16) -> AppResult<()>;

    /// Find the active membership record for a specific user within a tenant.
    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>>;
}
