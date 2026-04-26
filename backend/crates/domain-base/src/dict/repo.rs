use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    Dict,
    dict::{DictChildrenQuery, DictPageQuery, DictTreeQuery},
};

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

    /// Load dict items for tree building.
    ///
    /// # Arguments
    /// * `query` - Tree filter query
    ///
    /// # Returns
    /// * `AppResult<Vec<Dict>>` - Flat dict items for tree building
    async fn list_for_tree(&self, query: &DictTreeQuery) -> AppResult<Vec<Dict>>;

    /// Load direct dict children by parent id.
    ///
    /// # Arguments
    /// * `query` - Child list query
    ///
    /// # Returns
    /// * `AppResult<Vec<Dict>>` - Direct child dict items
    async fn list_by_parent(&self, query: &DictChildrenQuery) -> AppResult<Vec<Dict>>;

    /// Count direct dict children by parent id.
    ///
    /// # Arguments
    /// * `parent_id` - Parent dict id
    ///
    /// # Returns
    /// * `AppResult<i64>` - Direct child count
    async fn count_by_parent_id(&self, parent_id: i64) -> AppResult<i64>;

    /// Find a dict and all descendant ids.
    ///
    /// # Arguments
    /// * `id` - Root dict id
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - Root and descendant ids
    async fn find_descendant_ids(&self, id: i64) -> AppResult<Vec<i64>>;

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
