use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Tenant, tenant::TenantPageQuery};

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
