use std::sync::Arc;

use common::core::biz_error::USER_USERNAME_EXISTS;
use domain_base::{
    CreateUserCmd, PageUserCmd, UpdateUserCmd, User, UserRepository, UserService,
    user::UserPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    crypto::core::Crypto,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxUserRepository;

#[derive(Clone)]
pub struct UserServiceImpl<R>
where
    R: UserRepository,
{
    repository: Arc<R>,
}

impl UserServiceImpl<SqlxUserRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxUserRepository::new(pool)),
        }
    }
}

impl<R> UserServiceImpl<R>
where
    R: UserRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> UserService for UserServiceImpl<R>
where
    R: UserRepository,
{
    async fn create(&self, mut cmd: CreateUserCmd) -> AppResult<User> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if self
            .repository
            .find_by_username(&cmd.username)
            .await?
            .is_some()
        {
            return Err(AppError::DataError(
                USER_USERNAME_EXISTS,
                "username already exists".to_string(),
            ));
        }

        cmd.id = generate_sonyflake_id() as i64;
        cmd.password_hash = Crypto::hash_password(&cmd.password_hash)
            .map_err(|err| AppError::data_here(format!("failed to hash user password: {err}")))?;

        let user = User::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.create(&user).await
    }

    async fn get(&self, id: i64) -> AppResult<User> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user not found: {id}")))
    }

    async fn page(&self, cmd: PageUserCmd) -> AppResult<(Vec<User>, i64)> {
        let query = UserPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateUserCmd) -> AppResult<User> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut user = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user not found: {id}")))?;

        user.apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.update(&user).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            let existing = self
                .repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("user not found: {id}")))?;

            if existing.deleted_at.is_some() {
                continue;
            }
        }

        // self.repository.soft_delete_batch(&ids).await
        self.repository.hard_delete_batch(&ids).await
    }
}
