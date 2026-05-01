use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{RolePerm, role_perm::RolePermPageQuery};

#[async_trait]
pub trait RolePermRepository: Send + Sync {
    /// Create a new RolePerm.
    ///
    /// # Arguments
    /// * `role_perm` - RolePerm to create
    ///
    /// # Returns
    /// * `AppResult<RolePerm>` - Created RolePerm
    async fn create(&self, role_perm: &RolePerm) -> AppResult<RolePerm>;

    /// Find a RolePerm by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the RolePerm to find
    ///
    /// # Returns
    /// * `AppResult<Option<RolePerm>>` - Found RolePerm or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<RolePerm>>;

    /// Get a paginated list of role_perms.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<RolePerm>, i64)>` - Paged role_perms and total count
    async fn page(&self, query: &RolePermPageQuery) -> AppResult<(Vec<RolePerm>, i64)>;

    /// Update an existing RolePerm.
    ///
    /// # Arguments
    /// * `role_perm` - RolePerm with updated information
    ///
    /// # Returns
    /// * `AppResult<RolePerm>` - Updated RolePerm
    async fn update(&self, role_perm: &RolePerm) -> AppResult<RolePerm>;

    /// Batch soft delete RolePerms by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the RolePerms to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete RolePerms by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the RolePerms to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
