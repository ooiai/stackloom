use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    Tenant,
    tenant::{TenantChildrenQuery, TenantPageQuery, TenantTreeQuery},
};

#[async_trait]
pub trait TenantRepository: Send + Sync {
    /// Create a new Tenant.
    ///
    /// # Arguments
    /// * `tenant` - Tenant to create
    ///
    /// # Returns
    /// * `AppResult<Tenant>` - Created Tenant
    async fn create(&self, tenant: &Tenant) -> AppResult<Tenant>;

    /// Find a Tenant by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the Tenant to find
    ///
    /// # Returns
    /// * `AppResult<Option<Tenant>>` - Found Tenant or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<Tenant>>;

    /// Get a paginated list of tenants.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Tenant>, i64)>` - Paged tenants and total count
    async fn page(&self, query: &TenantPageQuery) -> AppResult<(Vec<Tenant>, i64)>;

    /// Load tenant items for tree building.
    ///
    /// # Arguments
    /// * `query` - Tree filter query
    ///
    /// # Returns
    /// * `AppResult<Vec<Tenant>>` - Flat tenant items for tree building
    async fn list_for_tree(&self, query: &TenantTreeQuery) -> AppResult<Vec<Tenant>>;

    /// Load direct tenant children by parent id.
    ///
    /// # Arguments
    /// * `query` - Child list query
    ///
    /// # Returns
    /// * `AppResult<Vec<Tenant>>` - Direct child tenant items
    async fn list_by_parent(&self, query: &TenantChildrenQuery) -> AppResult<Vec<Tenant>>;

    /// Count direct tenant children by parent id.
    ///
    /// # Arguments
    /// * `parent_id` - Parent tenant id
    ///
    /// # Returns
    /// * `AppResult<i64>` - Direct child count
    async fn count_by_parent_id(&self, parent_id: i64) -> AppResult<i64>;

    /// Find a tenant and all descendant ids.
    ///
    /// # Arguments
    /// * `id` - Root tenant id
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - Root and descendant ids
    async fn find_descendant_ids(&self, id: i64) -> AppResult<Vec<i64>>;

    /// Update an existing Tenant.
    ///
    /// # Arguments
    /// * `tenant` - Tenant with updated information
    ///
    /// # Returns
    /// * `AppResult<Tenant>` - Updated Tenant
    async fn update(&self, tenant: &Tenant) -> AppResult<Tenant>;

    /// Batch soft delete Tenants by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Tenants to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Tenants by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Tenants to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
