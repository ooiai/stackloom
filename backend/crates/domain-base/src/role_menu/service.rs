use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateRoleMenuCmd, PageRoleMenuCmd, RoleMenu, UpdateRoleMenuCmd};

#[async_trait]
pub trait RoleMenuService: Send + Sync {
    /// Create a new role_menu.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the role_menu details to create.
    ///
    /// # Returns
    /// * `AppResult<RoleMenu>` - The result of the create operation.
    async fn create(&self, cmd: CreateRoleMenuCmd) -> AppResult<RoleMenu>;

    /// Get a role_menu by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the role_menu to retrieve.
    ///
    /// # Returns
    /// * `AppResult<RoleMenu>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<RoleMenu>;

    /// Get a paginated list of role_menus.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<RoleMenu>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageRoleMenuCmd) -> AppResult<(Vec<RoleMenu>, i64)>;

    /// Update an existing role_menu.
    ///
    /// # Arguments
    /// * `id` - The ID of the role_menu to update.
    /// * `cmd` - The command containing the updated role_menu details.
    ///
    /// # Returns
    /// * `AppResult<RoleMenu>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateRoleMenuCmd) -> AppResult<RoleMenu>;

    /// Delete role_menus by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the role_menus to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
