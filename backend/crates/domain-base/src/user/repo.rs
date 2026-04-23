use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{User, user::UserPageQuery};

#[async_trait]
pub trait UserRepository: Send + Sync {
    /// Create a new User.
    ///
    /// # Arguments
    /// * `user` - User to create
    ///
    /// # Returns
    /// * `AppResult<User>` - Created User
    ///
    async fn create(&self, user: &User) -> AppResult<User>;

    /// Find a User by ID.
    ///
    /// # Arguments
    /// * `id` - ID of the User to find
    ///
    /// # Returns
    /// * `AppResult<Option<User>>` - Found User or None if not found
    ///
    async fn find_by_id(&self, id: i64) -> AppResult<Option<User>>;

    /// Find a User by username.
    ///
    /// # Arguments
    /// * `username` - Username of the User to find
    ///
    /// # Returns
    /// * `AppResult<Option<User>>` - Found User or None if not found
    ///
    async fn find_by_username(&self, username: &str) -> AppResult<Option<User>>;

    /// Get a paginated list of users.
    ///
    /// # Arguments
    /// * `query` - Pagination and filtering query
    ///
    /// # Returns
    /// * `AppResult<(Vec<User>, i64)>` - Paged users and total count
    ///
    async fn page(&self, query: &UserPageQuery) -> AppResult<(Vec<User>, i64)>;

    /// Update an existing User.
    ///
    /// # Arguments
    /// * `user` - User with updated information
    ///
    /// # Returns
    /// * `AppResult<User>` - Updated User
    ///
    async fn update(&self, user: &User) -> AppResult<User>;

    /// Batch soft delete Users by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Users to soft delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch soft delete operation
    ///
    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()>;

    /// Batch hard delete Users by IDs.
    ///
    /// # Arguments
    /// * `ids` - IDs of the Users to hard delete
    ///
    /// # Returns
    /// * `AppResult<()>` - Result of the batch hard delete operation
    ///
    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()>;
}
