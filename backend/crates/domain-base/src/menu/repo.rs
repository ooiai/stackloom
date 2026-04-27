use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{Menu, menu::MenuPageQuery};

#[async_trait]
pub trait MenuRepository: Send + Sync {
    /// Create a new Menu.
    ///
    /// # Arguments
    /// * `menu` - Menu to create
    ///
    /// # Returns
    /// * `AppResult<Menu>` - Created Menu
    async fn create(&self, menu: &Menu) -> AppResult<Menu>;

    /// Find a Menu by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the Menu to find
    ///
    /// # Returns
    /// * `AppResult<Option<Menu>>` - Found Menu or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<Menu>>;

    /// Get a paginated list of menus.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Menu>, i64)>` - Paged menus and total count
    async fn page(&self, query: &MenuPageQuery) -> AppResult<(Vec<Menu>, i64)>;

    /// Update an existing Menu.
    ///
    /// # Arguments
    /// * `menu` - Menu with updated information
    ///
    /// # Returns
    /// * `AppResult<Menu>` - Updated Menu
    async fn update(&self, menu: &Menu) -> AppResult<Menu>;

    /// Batch soft delete Menus by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Menus to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Menus by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Menus to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
