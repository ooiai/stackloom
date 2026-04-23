use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateUserCmd, PageUserCmd, UpdateUserCmd, User};

#[async_trait]
pub trait UserService: Send + Sync {
    /// Create a new user.
    ///
    /// # Arguments
    ///
    /// * `cmd` - The command containing the user details to create.
    ///
    /// # Returns
    /// * `AppResult<User>` - The result of the create operation, containing the created user.
    ///
    async fn create(&self, cmd: CreateUserCmd) -> AppResult<User>;

    /// Get a user by their ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the user to retrieve.
    ///
    /// # Returns
    /// * `AppResult<User>` - The result of the get operation, containing the user if found.
    ///
    async fn get(&self, id: i64) -> AppResult<User>;

    /// Get a paginated list of users.
    ///
    /// # Arguments
    ///
    /// * `cmd` - The command containing pagination and filtering details.
    ///
    /// # Returns
    /// * `AppResult<(Vec<User>, i64)>` - The result of the page operation, containing users and total count.
    ///
    async fn page(&self, cmd: PageUserCmd) -> AppResult<(Vec<User>, i64)>;

    /// Update an existing user.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the user to update.
    /// * `cmd` - The command containing the updated user details.
    ///
    /// # Returns
    /// * `AppResult<User>` - The result of the update operation, containing the updated user.
    ///
    async fn update(&self, id: i64, cmd: UpdateUserCmd) -> AppResult<User>;

    /// Delete a user by their ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the user to delete.
    ///
    /// # Returns
    /// * `AppResult<()>` - The result of the delete operation.
    ///
    async fn delete(&self, id: i64) -> AppResult<()>;
}
