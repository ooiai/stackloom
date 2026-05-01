use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Perm, perm::PermPageQuery};

#[async_trait]
pub trait PermRepository: Send + Sync {
    /// Create a new Perm.
    ///
    /// # Arguments
    /// * `perm` - Perm to create
    ///
    /// # Returns
    /// * `AppResult<Perm>` - Created Perm
    async fn create(&self, perm: &Perm) -> AppResult<Perm>;

    /// Find a Perm by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the Perm to find
    ///
    /// # Returns
    /// * `AppResult<Option<Perm>>` - Found Perm or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<Perm>>;

    /// Get a paginated list of perms.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Perm>, i64)>` - Paged perms and total count
    async fn page(&self, query: &PermPageQuery) -> AppResult<(Vec<Perm>, i64)>;

    /// Update an existing Perm.
    ///
    /// # Arguments
    /// * `perm` - Perm with updated information
    ///
    /// # Returns
    /// * `AppResult<Perm>` - Updated Perm
    async fn update(&self, perm: &Perm) -> AppResult<Perm>;

    /// Batch soft delete Perms by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Perms to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Perms by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Perms to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
