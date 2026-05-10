use std::sync::Arc;

use domain_system::{
    AuditLog, AuditLogFilter, AuditLogPageQuery, AuditLogRepository, AuditLogService,
    CreateAuditLogCmd, ListAuditLogCmd, PageAuditLogCmd,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxAuditLogRepository;

#[derive(Clone)]
pub struct AuditLogServiceImpl<R>
where
    R: AuditLogRepository,
{
    repository: Arc<R>,
}

impl AuditLogServiceImpl<SqlxAuditLogRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxAuditLogRepository::new(pool)),
        }
    }
}

impl<R> AuditLogServiceImpl<R>
where
    R: AuditLogRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> AuditLogService for AuditLogServiceImpl<R>
where
    R: AuditLogRepository,
{
    async fn create(&self, mut cmd: CreateAuditLogCmd) -> AppResult<AuditLog> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        cmd.id = generate_sonyflake_id() as i64;

        let log = AuditLog::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.create(&log).await
    }

    async fn page(&self, cmd: PageAuditLogCmd) -> AppResult<(Vec<AuditLog>, i64)> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.page(&AuditLogPageQuery::from(cmd)).await
    }

    async fn list(&self, cmd: ListAuditLogCmd) -> AppResult<Vec<AuditLog>> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.list(&AuditLogFilter::from(cmd)).await
    }
}
