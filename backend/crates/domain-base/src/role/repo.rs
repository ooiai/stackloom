use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    Role,
    role::{RoleChildrenQuery, RolePageQuery, RoleTreeQuery},
};

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

    /// Find a Role by code.
    async fn find_by_code(&self, code: &str) -> AppResult<Option<Role>>;

    /// Find a system-level role (tenant_id IS NULL) by code.
    ///
    /// Used by the signup flow to load a template that defines the default
    /// tenant-scoped role copied for each newly created tenant.
    async fn find_system_role_by_code(&self, code: &str) -> AppResult<Option<Role>>;

    /// Load role items for tree building.
    async fn list_for_tree(&self, query: &RoleTreeQuery) -> AppResult<Vec<Role>>;

    /// Load direct role children by parent id.
    async fn list_by_parent(&self, query: &RoleChildrenQuery) -> AppResult<Vec<Role>>;

    /// Count direct role children by parent id.
    async fn count_by_parent_id(&self, parent_id: i64) -> AppResult<i64>;

    /// Find a role and all descendant ids.
    async fn find_descendant_ids(&self, id: i64) -> AppResult<Vec<i64>>;

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
