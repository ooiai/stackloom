use std::sync::Arc;

use domain_base::{
    CreateTenantCmd, PageTenantCmd, Tenant, TenantRepository, TenantService, UpdateTenantCmd,
    tenant::TenantPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxTenantRepository;

#[derive(Clone)]
pub struct TenantServiceImpl<R>
where
    R: TenantRepository,
{
    repository: Arc<R>,
}

impl TenantServiceImpl<SqlxTenantRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxTenantRepository::new(pool)),
        }
    }
}

impl<R> TenantServiceImpl<R>
where
    R: TenantRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> TenantService for TenantServiceImpl<R>
where
    R: TenantRepository,
{
    async fn create(&self, mut cmd: CreateTenantCmd) -> AppResult<Tenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let tenant = Tenant::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&tenant).await
    }

    async fn get(&self, id: i64) -> AppResult<Tenant> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))
    }

    async fn page(&self, cmd: PageTenantCmd) -> AppResult<(Vec<Tenant>, i64)> {
        let query = TenantPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateTenantCmd) -> AppResult<Tenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut tenant = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))?;

        tenant
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&tenant).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
