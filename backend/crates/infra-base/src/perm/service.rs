use std::sync::Arc;

use domain_base::{
    Perm,
    PermRepository,
    PermService,
    CreatePermCmd,
    PagePermCmd,
    UpdatePermCmd,
    perm::PermPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxPermRepository;

#[derive(Clone)]
pub struct PermServiceImpl<R>
where
    R: PermRepository,
{
    repository: Arc<R>,
}

impl PermServiceImpl<SqlxPermRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxPermRepository::new(pool)),
        }
    }
}

impl<R> PermServiceImpl<R>
where
    R: PermRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> PermService for PermServiceImpl<R>
where
    R: PermRepository,
{
    async fn create(&self, mut cmd: CreatePermCmd) -> AppResult<Perm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let perm = Perm::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&perm).await
    }

    async fn get(&self, id: i64) -> AppResult<Perm> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))
    }

    async fn page(&self, cmd: PagePermCmd) -> AppResult<(Vec<Perm>, i64)> {
        let query = PermPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdatePermCmd) -> AppResult<Perm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut perm = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))?;

        perm
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&perm).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
