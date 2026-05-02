use std::sync::Arc;

use domain_system::{
    CreateSystemLogCmd, ListSystemLogCmd, PageSystemLogCmd, SystemLog, SystemLogFilter,
    SystemLogPageQuery, SystemLogRepository, SystemLogService,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxSystemLogRepository;

#[derive(Clone)]
pub struct SystemLogServiceImpl<R>
where
    R: SystemLogRepository,
{
    repository: Arc<R>,
}

impl SystemLogServiceImpl<SqlxSystemLogRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxSystemLogRepository::new(pool)),
        }
    }
}

impl<R> SystemLogServiceImpl<R>
where
    R: SystemLogRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> SystemLogService for SystemLogServiceImpl<R>
where
    R: SystemLogRepository,
{
    async fn create(&self, mut cmd: CreateSystemLogCmd) -> AppResult<SystemLog> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        cmd.id = generate_sonyflake_id() as i64;

        let log = SystemLog::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.create(&log).await
    }

    async fn page(&self, cmd: PageSystemLogCmd) -> AppResult<(Vec<SystemLog>, i64)> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.page(&SystemLogPageQuery::from(cmd)).await
    }

    async fn list(&self, cmd: ListSystemLogCmd) -> AppResult<Vec<SystemLog>> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.list(&SystemLogFilter::from(cmd)).await
    }
}
