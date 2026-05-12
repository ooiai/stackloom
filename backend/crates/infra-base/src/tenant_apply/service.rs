use std::sync::Arc;

use common::core::biz_error::TENANT_APPLY_NOT_FOUND;
use domain_base::{
    TenantApplyRepository, TenantApplyService, TenantApplyView,
    tenant_apply::{ApproveTenantApplyCmd, BanTenantApplyCmd, PageTenantApplyCmd, RejectTenantApplyCmd},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxTenantApplyRepository;

#[derive(Clone)]
pub struct TenantApplyServiceImpl<R>
where
    R: TenantApplyRepository,
{
    repository: Arc<R>,
}

impl TenantApplyServiceImpl<SqlxTenantApplyRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxTenantApplyRepository::new(pool)),
        }
    }
}

impl<R> TenantApplyServiceImpl<R>
where
    R: TenantApplyRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> TenantApplyService for TenantApplyServiceImpl<R>
where
    R: TenantApplyRepository,
{
    async fn page(&self, cmd: PageTenantApplyCmd) -> AppResult<(Vec<TenantApplyView>, i64)> {
        self.repository.page(&cmd).await
    }

    async fn approve(&self, cmd: ApproveTenantApplyCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    TENANT_APPLY_NOT_FOUND,
                    format!("tenant apply not found: {}", cmd.id),
                )
            })?;

        self.repository.approve(&cmd).await
    }

    async fn reject(&self, cmd: RejectTenantApplyCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    TENANT_APPLY_NOT_FOUND,
                    format!("tenant apply not found: {}", cmd.id),
                )
            })?;

        self.repository.reject(&cmd).await
    }

    async fn ban(&self, cmd: BanTenantApplyCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    TENANT_APPLY_NOT_FOUND,
                    format!("tenant apply not found: {}", cmd.id),
                )
            })?;

        self.repository.ban(&cmd).await
    }
}
