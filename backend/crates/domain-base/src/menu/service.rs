use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateMenuCmd, PageMenuCmd, UpdateMenuCmd, Menu};

#[async_trait]
pub trait MenuService: Send + Sync {
    /// Create a new menu.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the menu details to create.
    ///
    /// # Returns
    /// * `AppResult<Menu>` - The result of the create operation.
    async fn create(&self, cmd: CreateMenuCmd) -> AppResult<Menu>;

    /// Get a menu by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the menu to retrieve.
    ///
    /// # Returns
    /// * `AppResult<Menu>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<Menu>;

    /// Get a paginated list of menus.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<Menu>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageMenuCmd) -> AppResult<(Vec<Menu>, i64)>;

    /// Update an existing menu.
    ///
    /// # Arguments
    /// * `id` - The ID of the menu to update.
    /// * `cmd` - The command containing the updated menu details.
    ///
    /// # Returns
    /// * `AppResult<Menu>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateMenuCmd) -> AppResult<Menu>;

    /// Delete menus by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the menus to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
