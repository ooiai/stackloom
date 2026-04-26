use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    ChildrenDictCmd, CreateDictCmd, Dict, PageDictCmd, RemoveCascadeDictCmd, TreeDictCmd,
    UpdateDictCmd,
};

#[async_trait]
pub trait DictService: Send + Sync {
    /// Create a new dict.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the dict details to create.
    ///
    /// # Returns
    /// * `AppResult<Dict>` - The result of the create operation.
    async fn create(&self, cmd: CreateDictCmd) -> AppResult<Dict>;

    /// Get a dict by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the dict to retrieve.
    ///
    /// # Returns
    /// * `AppResult<Dict>` - The result of the get operation.
    async fn get(&self, id: i64) -> AppResult<Dict>;

    /// Get a paginated list of dicts.
    ///
    /// # Arguments
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<Dict>, i64)>` - The result of the page operation.
    async fn page(&self, cmd: PageDictCmd) -> AppResult<(Vec<Dict>, i64)>;

    /// Load the dict tree.
    ///
    /// # Arguments
    /// * `cmd` - The command containing tree filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Dict>>` - The dict tree as a flat list.
    async fn tree(&self, cmd: TreeDictCmd) -> AppResult<Vec<Dict>>;

    /// Load direct dict children by parent.
    ///
    /// # Arguments
    /// * `cmd` - The command containing parent and filter details.
    ///
    /// # Returns
    /// * `AppResult<Vec<Dict>>` - Direct child dict items.
    async fn children(&self, cmd: ChildrenDictCmd) -> AppResult<Vec<Dict>>;

    /// Update an existing dict.
    ///
    /// # Arguments
    /// * `id` - The ID of the dict to update.
    /// * `cmd` - The command containing the updated dict details.
    ///
    /// # Returns
    /// * `AppResult<Dict>` - The result of the update operation.
    async fn update(&self, id: i64, cmd: UpdateDictCmd) -> AppResult<Dict>;

    /// Delete dicts by their IDs.
    ///
    /// # Arguments
    /// * `ids` - The IDs of the dicts to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;

    /// Delete a dict and all its descendants.
    ///
    /// # Arguments
    /// * `cmd` - The command containing the root dict id.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the cascade delete operation.
    async fn remove_cascade(&self, cmd: RemoveCascadeDictCmd) -> AppResult<()>;
}
