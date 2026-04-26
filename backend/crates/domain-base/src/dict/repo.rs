use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Dict, dict::DictPageQuery};

#[async_trait]
pub trait DictRepository: Send + Sync {
    /// Create a new Dict.
    ///
    /// # Arguments
    /// * `dict` - Dict to create
    ///
    /// # Returns
    /// * `AppResult<Dict>` - Created Dict
    async fn create(&self, dict: &Dict) -> AppResult<Dict>;

    /// Find a Dict by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the Dict to find
    ///
    /// # Returns
    /// * `AppResult<Option<Dict>>` - Found Dict or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<Dict>>;

    /// Get a paginated list of dicts.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Dict>, i64)>` - Paged dicts and total count
    async fn page(&self, query: &DictPageQuery) -> AppResult<(Vec<Dict>, i64)>;

    /// Update an existing Dict.
    ///
    /// # Arguments
    /// * `dict` - Dict with updated information
    ///
    /// # Returns
    /// * `AppResult<Dict>` - Updated Dict
    async fn update(&self, dict: &Dict) -> AppResult<Dict>;

    /// Batch soft delete Dicts by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Dicts to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Dicts by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Dicts to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
