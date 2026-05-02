use std::sync::Arc;

use domain_base::{
    Role,
    RoleRepository,
    RoleService,
    CreateRoleCmd,
    PageRoleCmd,
    UpdateRoleCmd,
    role::RolePageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxRoleRepository;

#[derive(Clone)]
pub struct RoleServiceImpl<R>
where
    R: RoleRepository,
{
    repository: Arc<R>,
}

impl RoleServiceImpl<SqlxRoleRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxRoleRepository::new(pool)),
        }
    }
}

impl<R> RoleServiceImpl<R>
where
    R: RoleRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> RoleService for RoleServiceImpl<R>
where
    R: RoleRepository,
{
    async fn create(&self, mut cmd: CreateRoleCmd) -> AppResult<Role> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let role = Role::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&role).await
    }

    async fn get(&self, id: i64) -> AppResult<Role> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))
    }

    async fn page(&self, cmd: PageRoleCmd) -> AppResult<(Vec<Role>, i64)> {
        let query = RolePageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateRoleCmd) -> AppResult<Role> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut role = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))?;

        role
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&role).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
