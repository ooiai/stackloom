use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    CreateRoleCmd, PageRoleCmd, Role, UpdateRoleCmd,
    role::{
        AssignRoleMenusCmd, AssignRolePermsCmd, ChildrenRoleCmd, RemoveCascadeRoleCmd, TreeRoleCmd,
    },
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
    ///
    /// # Arguments
    /// * `cmd` - The command containing tree filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Role>>` - The role tree as a flat list.
    async fn tree(&self, cmd: TreeRoleCmd) -> AppResult<Vec<Role>>;

    /// Load direct role children by parent.
    ///
    /// # Arguments
    /// * `cmd` - The command containing parent and filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Role>>` - Direct child role items.
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
    ///
    /// # Arguments
    /// * `cmd` - The command containing the root role id.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the cascade delete operation.
    async fn remove_cascade(&self, cmd: RemoveCascadeRoleCmd) -> AppResult<()>;

    /// List all active roles visible within a tenant: system roles
    /// (`tenant_id IS NULL`) **plus** roles belonging to the given tenant.
    ///
    /// # Arguments
    /// * `tenant_id` - The tenant whose roles to load alongside system roles.
    ///
    /// # Returns
    /// * `AppResult<Vec<Role>>` - System and tenant-scoped active roles ordered by sort.
    async fn list_for_tenant(&self, tenant_id: i64) -> AppResult<Vec<Role>>;

    /// Get assigned menu IDs for a role.
    ///
    /// # Arguments
    /// * `role_id` - The ID of the role.
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - The list of assigned menu IDs.
    async fn get_role_menus(&self, role_id: i64) -> AppResult<Vec<i64>>;

    /// Assign menus to a role.
    ///
    /// # Arguments
    /// * `cmd` - The command containing `role_id` and the new menu ID list.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the assign operation.
    async fn assign_menus(&self, cmd: AssignRoleMenusCmd) -> AppResult<()>;

    /// Get assigned perm IDs for a role.
    ///
    /// # Arguments
    /// * `role_id` - The ID of the role.
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - The list of assigned perm IDs.
    async fn get_role_perms(&self, role_id: i64) -> AppResult<Vec<i64>>;

    /// Assign perms to a role.
    ///
    /// # Arguments
    /// * `cmd` - The command containing `role_id` and the new perm ID list.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the assign operation.
    async fn assign_perms(&self, cmd: AssignRolePermsCmd) -> AppResult<()>;
}
