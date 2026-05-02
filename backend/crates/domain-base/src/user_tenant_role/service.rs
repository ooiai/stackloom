use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    CreateUserTenantRoleCmd, PageUserTenantRoleCmd, UpdateUserTenantRoleCmd, UserTenantRole,
};

#[async_trait]
pub trait UserTenantRoleService: Send + Sync {
    /// Create a new user_tenant_role.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the user_tenant_role details to create.
    ///
    /// # Returns
    /// * `AppResult<UserTenantRole>` - The result of the create operation.
    async fn create(&self, cmd: CreateUserTenantRoleCmd) -> AppResult<UserTenantRole>;

    /// Get a user_tenant_role by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the user_tenant_role to retrieve.
    ///
    /// # Returns
    /// * `AppResult<UserTenantRole>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<UserTenantRole>;

    /// Get a paginated list of user_tenant_roles.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<UserTenantRole>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageUserTenantRoleCmd) -> AppResult<(Vec<UserTenantRole>, i64)>;

    /// Update an existing user_tenant_role.
    ///
    /// # Arguments
    /// * `id` - The ID of the user_tenant_role to update.
    /// * `cmd` - The command containing the updated user_tenant_role details.
    ///
    /// # Returns
    /// * `AppResult<UserTenantRole>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateUserTenantRoleCmd) -> AppResult<UserTenantRole>;

    /// Delete user_tenant_roles by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the user_tenant_roles to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
