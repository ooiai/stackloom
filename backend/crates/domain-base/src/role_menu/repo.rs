use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{RoleMenu, role_menu::RoleMenuPageQuery};

#[async_trait]
pub trait RoleMenuRepository: Send + Sync {
    /// Create a new RoleMenu.
    ///
    /// # Arguments
    /// * `role_menu` - RoleMenu to create
    ///
    /// # Returns
    /// * `AppResult<RoleMenu>` - Created RoleMenu
    async fn create(&self, role_menu: &RoleMenu) -> AppResult<RoleMenu>;

    /// Find a RoleMenu by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the RoleMenu to find
    ///
    /// # Returns
    /// * `AppResult<Option<RoleMenu>>` - Found RoleMenu or None if not found
    async fn find_by_id(&self, id: i64) -> AppResult<Option<RoleMenu>>;

    /// Get a paginated list of role_menus.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<RoleMenu>, i64)>` - Paged role_menus and total count
    async fn page(&self, query: &RoleMenuPageQuery) -> AppResult<(Vec<RoleMenu>, i64)>;

    /// Update an existing RoleMenu.
    ///
    /// # Arguments
    /// * `role_menu` - RoleMenu with updated information
    ///
    /// # Returns
    /// * `AppResult<RoleMenu>` - Updated RoleMenu
    async fn update(&self, role_menu: &RoleMenu) -> AppResult<RoleMenu>;

    /// Batch soft delete RoleMenus by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the RoleMenus to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete RoleMenus by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the RoleMenus to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
