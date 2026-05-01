use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateUserTenantCmd, PageUserTenantCmd, UpdateUserTenantCmd, UserTenant};

#[async_trait]
pub trait UserTenantService: Send + Sync {
    /// Create a new user_tenant.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the user_tenant details to create.
    ///
    /// # Returns
    /// * `AppResult<UserTenant>` - The result of the create operation.
    async fn create(&self, cmd: CreateUserTenantCmd) -> AppResult<UserTenant>;

    /// Get a user_tenant by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the user_tenant to retrieve.
    ///
    /// # Returns
    /// * `AppResult<UserTenant>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<UserTenant>;

    /// Get a paginated list of user_tenants.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<UserTenant>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageUserTenantCmd) -> AppResult<(Vec<UserTenant>, i64)>;

    /// Update an existing user_tenant.
    ///
    /// # Arguments
    /// * `id` - The ID of the user_tenant to update.
    /// * `cmd` - The command containing the updated user_tenant details.
    ///
    /// # Returns
    /// * `AppResult<UserTenant>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateUserTenantCmd) -> AppResult<UserTenant>;

    /// Delete user_tenants by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the user_tenants to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
