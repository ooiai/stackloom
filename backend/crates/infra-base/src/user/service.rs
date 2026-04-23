use std::sync::Arc;

use domain_base::{
    CreateUserCmd, PageUserCmd, UpdateUserCmd, User, UserRepository, UserService,
    user::UserPageQuery,
};
use neocrates::{
    async_trait::async_trait, helper::core::snowflake::generate_sonyflake_id,
    response::error::AppResult, sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxUserRepository;

#[derive(Clone)]
pub struct UserUseCase<R>
where
    R: UserRepository,
{
    repository: Arc<R>,
}

pub type SqlxUserService<R> = UserUseCase<R>;

impl UserUseCase<SqlxUserRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxUserRepository::new(pool)),
        }
    }
}

impl<R> UserUseCase<R>
where
    R: UserRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }

    fn validate_create_cmd(cmd: &CreateUserCmd) -> AppResult<()> {
        if cmd.username.trim().is_empty() {
            return Err(neocrates::response::error::AppError::ValidationError(
                "username cannot be empty".to_string(),
            ));
        }

        if cmd.password_hash.trim().is_empty() {
            return Err(neocrates::response::error::AppError::ValidationError(
                "password_hash cannot be empty".to_string(),
            ));
        }

        Self::validate_gender(cmd.gender)?;
        Self::validate_status(cmd.status)?;
        Ok(())
    }

    fn validate_update_cmd(cmd: &UpdateUserCmd) -> AppResult<()> {
        if let Some(gender) = cmd.gender {
            Self::validate_gender(gender)?;
        }

        if let Some(status) = cmd.status {
            Self::validate_status(status)?;
        }

        Ok(())
    }

    fn validate_gender(value: i16) -> AppResult<()> {
        match value {
            0 | 1 | 2 => Ok(()),
            _ => Err(neocrates::response::error::AppError::ValidationError(
                format!("invalid gender value: {value}"),
            )),
        }
    }

    fn validate_status(value: i16) -> AppResult<()> {
        match value {
            0 | 1 | 2 => Ok(()),
            _ => Err(neocrates::response::error::AppError::ValidationError(
                format!("invalid status value: {value}"),
            )),
        }
    }
}

#[async_trait]
impl<R> UserService for UserUseCase<R>
where
    R: UserRepository,
{
    async fn create(&self, mut cmd: CreateUserCmd) -> AppResult<User> {
        Self::validate_create_cmd(&cmd)?;

        if self
            .repository
            .find_by_username(&cmd.username)
            .await?
            .is_some()
        {
            return Err(neocrates::response::error::AppError::conflict_here(
                format!("username '{}' already exists", cmd.username),
            ));
        }

        cmd.id = generate_sonyflake_id() as i64;

        let user = User::new(cmd);
        self.repository.create(&user).await
    }

    async fn get(&self, id: i64) -> AppResult<User> {
        self.repository.find_by_id(id).await?.ok_or_else(|| {
            neocrates::response::error::AppError::not_found_here(format!("user not found: {id}"))
        })
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
        Self::validate_update_cmd(&cmd)?;

        let mut user = self.repository.find_by_id(id).await?.ok_or_else(|| {
            neocrates::response::error::AppError::not_found_here(format!("user not found: {id}"))
        })?;

        user.apply_update(cmd);
        self.repository.update(&user).await
    }

    async fn delete(&self, id: i64) -> AppResult<()> {
        let existing = self.repository.find_by_id(id).await?.ok_or_else(|| {
            neocrates::response::error::AppError::not_found_here(format!("user not found: {id}"))
        })?;

        if existing.deleted_at.is_some() {
            return Ok(());
        }

        self.repository.soft_delete(id).await
    }
}
