use std::sync::Arc;

use domain_base::{
    Dict,
    DictRepository,
    DictService,
    CreateDictCmd,
    PageDictCmd,
    UpdateDictCmd,
    dict::DictPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxDictRepository;

#[derive(Clone)]
pub struct DictServiceImpl<R>
where
    R: DictRepository,
{
    repository: Arc<R>,
}

impl DictServiceImpl<SqlxDictRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxDictRepository::new(pool)),
        }
    }
}

impl<R> DictServiceImpl<R>
where
    R: DictRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> DictService for DictServiceImpl<R>
where
    R: DictRepository,
{
    async fn create(&self, mut cmd: CreateDictCmd) -> AppResult<Dict> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let dict = Dict::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&dict).await
    }

    async fn get(&self, id: i64) -> AppResult<Dict> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))
    }

    async fn page(&self, cmd: PageDictCmd) -> AppResult<(Vec<Dict>, i64)> {
        let query = DictPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateDictCmd) -> AppResult<Dict> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut dict = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))?;

        dict
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&dict).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
