use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Role, role::RolePageQuery};

#[async_trait]
pub trait RoleRepository: Send + Sync {
    /// Create a new Role.
    ///
    /// # Arguments
    /// * `role` - Role to create
    ///
    /// # Returns
    /// * `AppResult<Role>` - Created Role
    async fn create(&self, role: &Role) -> AppResult<Role>;

    /// Find a Role by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the Role to find
    ///
    /// # Returns
    /// * `AppResult<Option<Role>>` - Found Role or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<Role>>;

    /// Get a paginated list of roles.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Role>, i64)>` - Paged roles and total count
    async fn page(&self, query: &RolePageQuery) -> AppResult<(Vec<Role>, i64)>;

    /// Update an existing Role.
    ///
    /// # Arguments
    /// * `role` - Role with updated information
    ///
    /// # Returns
    /// * `AppResult<Role>` - Updated Role
    async fn update(&self, role: &Role) -> AppResult<Role>;

    /// Batch soft delete Roles by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Roles to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Roles by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Roles to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
