use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateRolePermCmd, PageRolePermCmd, RolePerm, UpdateRolePermCmd};

#[async_trait]
pub trait RolePermService: Send + Sync {
    /// Create a new role_perm.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the role_perm details to create.
    ///
    /// # Returns
    /// * `AppResult<RolePerm>` - The result of the create operation.
    async fn create(&self, cmd: CreateRolePermCmd) -> AppResult<RolePerm>;

    /// Get a role_perm by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the role_perm to retrieve.
    ///
    /// # Returns
    /// * `AppResult<RolePerm>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<RolePerm>;

    /// Get a paginated list of role_perms.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<RolePerm>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageRolePermCmd) -> AppResult<(Vec<RolePerm>, i64)>;

    /// Update an existing role_perm.
    ///
    /// # Arguments
    /// * `id` - The ID of the role_perm to update.
    /// * `cmd` - The command containing the updated role_perm details.
    ///
    /// # Returns
    /// * `AppResult<RolePerm>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateRolePermCmd) -> AppResult<RolePerm>;

    /// Delete role_perms by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the role_perms to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
