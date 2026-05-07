use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    Menu,
    menu::{MenuChildrenQuery, MenuPageQuery, MenuTreeQuery},
};

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

    /// Find a Menu by code.
    ///
    /// # Arguments
    /// * `code` - Code of the Menu to find
    ///
    /// # Returns
    /// * `AppResult<Option<Menu>>` - Found Menu or None if not found
    async fn find_by_code(&self, code: &str) -> AppResult<Option<Menu>>;

    /// Get a paginated list of menus.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<Menu>, i64)>` - Paged menus and total count
    async fn page(&self, query: &MenuPageQuery) -> AppResult<(Vec<Menu>, i64)>;

    /// Load menu items for tree building.
    ///
    /// # Arguments
    /// * `query` - Tree filter query
    ///
    /// # Returns
    /// * `AppResult<Vec<Menu>>` - Flat menu items for tree building
    async fn list_for_tree(&self, query: &MenuTreeQuery) -> AppResult<Vec<Menu>>;

    /// Load direct menu children by parent id.
    ///
    /// # Arguments
    /// * `query` - Child list query
    ///
    /// # Returns
    /// * `AppResult<Vec<Menu>>` - Direct child menu items
    async fn list_by_parent(&self, query: &MenuChildrenQuery) -> AppResult<Vec<Menu>>;

    /// Count direct menu children by parent id.
    ///
    /// # Arguments
    /// * `parent_id` - Parent menu id
    ///
    /// # Returns
    /// * `AppResult<i64>` - Direct child count
    async fn count_by_parent_id(&self, parent_id: i64) -> AppResult<i64>;

    /// Find a menu and all descendant ids.
    ///
    /// # Arguments
    /// * `id` - Root menu id
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - Root and descendant ids
    async fn find_descendant_ids(&self, id: i64) -> AppResult<Vec<i64>>;

    /// Load distinct menu ids granted to the provided role ids.
    ///
    /// # Arguments
    /// * `role_ids` - Role ids whose menu assignments should be merged.
    ///
    /// # Returns
    /// * `AppResult<Vec<i64>>` - Distinct granted menu ids.
    async fn list_menu_ids_by_role_ids(&self, role_ids: &[i64]) -> AppResult<Vec<i64>>;

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
