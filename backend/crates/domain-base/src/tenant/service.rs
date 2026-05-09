use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    CreateTenantCmd, PageTenantCmd, Tenant, UpdateTenantCmd,
    tenant::{ChildrenTenantCmd, RemoveCascadeTenantCmd, TreeTenantCmd},
};

#[async_trait]
pub trait TenantService: Send + Sync {
    /// Create a new tenant.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the tenant details to create.
    ///
    /// # Returns
    /// * `AppResult<Tenant>` - The result of the create operation.
    async fn create(&self, cmd: CreateTenantCmd) -> AppResult<Tenant>;

    /// Get a tenant by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the tenant to retrieve.
    ///
    /// # Returns
    /// * `AppResult<Tenant>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<Tenant>;

    /// Get a paginated list of tenants.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<Tenant>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageTenantCmd) -> AppResult<(Vec<Tenant>, i64)>;

    /// Load the tenant tree.
    ///
    /// # Arguments
    /// * `cmd` - The command containing tree filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Tenant>>` - The tenant tree as a flat list.
    async fn tree(&self, cmd: TreeTenantCmd) -> AppResult<Vec<Tenant>>;

    /// Load direct tenant children by parent.
    ///
    /// # Arguments
    /// * `cmd` - The command containing parent and filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Tenant>>` - Direct child tenant items.
    async fn children(&self, cmd: ChildrenTenantCmd) -> AppResult<Vec<Tenant>>;

    /// Update an existing tenant.
    ///
    /// # Arguments
    /// * `id` - The ID of the tenant to update.
    /// * `cmd` - The command containing the updated tenant details.
    ///
    /// # Returns
    /// * `AppResult<Tenant>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateTenantCmd) -> AppResult<Tenant>;

    /// Delete tenants by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the tenants to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;

    /// Delete a tenant and all descendants.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the root tenant id.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the cascade delete operation.
    async fn remove_cascade(&self, cmd: RemoveCascadeTenantCmd) -> AppResult<()>;

    /// List all active tenants that a user belongs to.
    ///
    /// # Arguments
    /// * `user_id` - The user's ID.
    ///
    /// # Returns
    /// * `AppResult<Vec<(Tenant, bool)>>` - All tenants the user is an active member of, with is_default flag.
    async fn list_by_user_id(&self, user_id: i64) -> AppResult<Vec<(Tenant, bool)>>;
}
