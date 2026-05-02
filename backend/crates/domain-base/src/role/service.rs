use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    CreateRoleCmd, PageRoleCmd, Role, UpdateRoleCmd,
    role::{ChildrenRoleCmd, RemoveCascadeRoleCmd, TreeRoleCmd},
};

#[async_trait]
pub trait RoleService: Send + Sync {
    /// Create a new role.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the role details to create.
    ///
    /// # Returns
    /// * `AppResult<Role>` - The result of the create operation.
    async fn create(&self, cmd: CreateRoleCmd) -> AppResult<Role>;

    /// Get a role by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the role to retrieve.
    ///
    /// # Returns
    /// * `AppResult<Role>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<Role>;

    /// Get a paginated list of roles.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<Role>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageRoleCmd) -> AppResult<(Vec<Role>, i64)>;

    /// Load the role tree.
    async fn tree(&self, cmd: TreeRoleCmd) -> AppResult<Vec<Role>>;

    /// Load direct role children by parent.
    async fn children(&self, cmd: ChildrenRoleCmd) -> AppResult<Vec<Role>>;

    /// Update an existing role.
    ///
    /// # Arguments
    /// * `id` - The ID of the role to update.
    /// * `cmd` - The command containing the updated role details.
    ///
    /// # Returns
    /// * `AppResult<Role>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateRoleCmd) -> AppResult<Role>;

    /// Delete roles by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the roles to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;

    /// Delete a role and all descendants.
    async fn remove_cascade(&self, cmd: RemoveCascadeRoleCmd) -> AppResult<()>;
}
