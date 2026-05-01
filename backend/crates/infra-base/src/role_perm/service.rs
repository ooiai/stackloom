use std::sync::Arc;

use domain_base::{
    RolePerm,
    RolePermRepository,
    RolePermService,
    CreateRolePermCmd,
    PageRolePermCmd,
    UpdateRolePermCmd,
    role_perm::RolePermPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxRolePermRepository;

#[derive(Clone)]
pub struct RolePermServiceImpl<R>
where
    R: RolePermRepository,
{
    repository: Arc<R>,
}

impl RolePermServiceImpl<SqlxRolePermRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxRolePermRepository::new(pool)),
        }
    }
}

impl<R> RolePermServiceImpl<R>
where
    R: RolePermRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> RolePermService for RolePermServiceImpl<R>
where
    R: RolePermRepository,
{
    async fn create(&self, mut cmd: CreateRolePermCmd) -> AppResult<RolePerm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let role_perm = RolePerm::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&role_perm).await
    }

    async fn get(&self, id: i64) -> AppResult<RolePerm> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role_perm not found: {id}")))
    }

    async fn page(&self, cmd: PageRolePermCmd) -> AppResult<(Vec<RolePerm>, i64)> {
        let query = RolePermPageQuery {
            keyword: cmd.keyword,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateRolePermCmd) -> AppResult<RolePerm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut role_perm = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role_perm not found: {id}")))?;

        role_perm
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&role_perm).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("role_perm not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
