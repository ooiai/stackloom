use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{UserTenantRole, user_tenant_role::UserTenantRolePageQuery};

#[async_trait]
pub trait UserTenantRoleRepository: Send + Sync {
    /// Create a new UserTenantRole.
    ///
    /// # Arguments
    /// * `user_tenant_role` - UserTenantRole to create
    ///
    /// # Returns
    /// * `AppResult<UserTenantRole>` - Created UserTenantRole
    async fn create(&self, user_tenant_role: &UserTenantRole) -> AppResult<UserTenantRole>;

    /// Find a UserTenantRole by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the UserTenantRole to find
    ///
    /// # Returns
    /// * `AppResult<Option<UserTenantRole>>` - Found UserTenantRole or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<UserTenantRole>>;

    /// Get a paginated list of user_tenant_roles.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<UserTenantRole>, i64)>` - Paged user_tenant_roles and total count
    async fn page(&self, query: &UserTenantRolePageQuery) -> AppResult<(Vec<UserTenantRole>, i64)>;

    /// Update an existing UserTenantRole.
    ///
    /// # Arguments
    /// * `user_tenant_role` - UserTenantRole with updated information
    ///
    /// # Returns
    /// * `AppResult<UserTenantRole>` - Updated UserTenantRole
    async fn update(&self, user_tenant_role: &UserTenantRole) -> AppResult<UserTenantRole>;

    /// Batch soft delete UserTenantRoles by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the UserTenantRoles to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete UserTenantRoles by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the UserTenantRoles to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// List all role bindings for a given membership.
    ///
    /// # Arguments
    /// * `user_tenant_id` - The membership ID whose role bindings to load
    ///
    /// # Returns
    /// * `AppResult<Vec<UserTenantRole>>` - All active role bindings for the membership
    async fn list_by_membership(&self, user_tenant_id: i64) -> AppResult<Vec<UserTenantRole>>;

    /// Atomically replace all role bindings for a membership with a new set.
    ///
    /// Executes a `DELETE … WHERE user_tenant_id = ?` followed by a bulk
    /// `INSERT` inside a single database transaction.  Passing an empty
    /// `role_ids` slice clears all bindings.
    ///
    /// # Arguments
    /// * `user_tenant_id` - The membership ID whose bindings to replace
    /// * `role_ids` - The complete new set of role IDs to assign
    ///
    /// # Returns
    /// * `AppResult<()>` - `Ok(())` on success
    async fn replace_by_membership(
        &self,
        user_tenant_id: i64,
        role_ids: &[i64],
    ) -> AppResult<()>;
}
