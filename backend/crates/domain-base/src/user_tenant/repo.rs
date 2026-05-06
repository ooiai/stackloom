use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{UserTenant, user_tenant::UserTenantPageQuery};

#[async_trait]
pub trait UserTenantRepository: Send + Sync {
    /// Create a new UserTenant.
    ///
    /// # Arguments
    /// * `user_tenant` - UserTenant to create
    ///
    /// # Returns
    /// * `AppResult<UserTenant>` - Created UserTenant
    async fn create(&self, user_tenant: &UserTenant) -> AppResult<UserTenant>;

    /// Find a UserTenant by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the UserTenant to find
    ///
    /// # Returns
    /// * `AppResult<Option<UserTenant>>` - Found UserTenant or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<UserTenant>>;

    /// Get a paginated list of user_tenants.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<UserTenant>, i64)>` - Paged user_tenants and total count
    async fn page(&self, query: &UserTenantPageQuery) -> AppResult<(Vec<UserTenant>, i64)>;

    /// Update an existing UserTenant.
    ///
    /// # Arguments
    /// * `user_tenant` - UserTenant with updated information
    ///
    /// # Returns
    /// * `AppResult<UserTenant>` - Updated UserTenant
    async fn update(&self, user_tenant: &UserTenant) -> AppResult<UserTenant>;

    /// Batch soft delete UserTenants by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the UserTenants to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete UserTenants by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the UserTenants to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Find the active membership record for a specific user within a tenant.
    ///
    /// # Arguments
    /// * `user_id` - The user's ID
    /// * `tenant_id` - The tenant's ID
    ///
    /// # Returns
    /// * `AppResult<Option<UserTenant>>` - The membership row if found, `None` if the user
    ///   is not a member of that tenant or has been soft-deleted
    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>>;
}
