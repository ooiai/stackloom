use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreatePermCmd, PagePermCmd, UpdatePermCmd, Perm};

#[async_trait]
pub trait PermService: Send + Sync {
    /// Create a new perm.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the perm details to create.
    ///
    /// # Returns
    /// * `AppResult<Perm>` - The result of the create operation.
    async fn create(&self, cmd: CreatePermCmd) -> AppResult<Perm>;

    /// Get a perm by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the perm to retrieve.
    ///
    /// # Returns
    /// * `AppResult<Perm>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<Perm>;

    /// Get a paginated list of perms.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<Perm>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PagePermCmd) -> AppResult<(Vec<Perm>, i64)>;

    /// Update an existing perm.
    ///
    /// # Arguments
    /// * `id` - The ID of the perm to update.
    /// * `cmd` - The command containing the updated perm details.
    ///
    /// # Returns
    /// * `AppResult<Perm>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdatePermCmd) -> AppResult<Perm>;

    /// Delete perms by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the perms to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;
}
