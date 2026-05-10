use std::sync::Arc;

use domain_base::{
    CreateOperationLogCmd, ListOperationLogCmd, OperationLog, OperationLogRepository,
    OperationLogService, PageOperationLogCmd,
    operation_log::{OperationLogFilter, OperationLogListQuery, OperationLogPageQuery},
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxOperationLogRepository;

#[derive(Clone)]
pub struct OperationLogServiceImpl<R>
where
    R: OperationLogRepository,
{
    repository: Arc<R>,
}

impl OperationLogServiceImpl<SqlxOperationLogRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxOperationLogRepository::new(pool)),
        }
    }
}

impl<R> OperationLogServiceImpl<R>
where
    R: OperationLogRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> OperationLogService for OperationLogServiceImpl<R>
where
    R: OperationLogRepository,
{
    async fn create(&self, mut cmd: CreateOperationLogCmd) -> AppResult<OperationLog> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let operation_log =
            OperationLog::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&operation_log).await
    }

    async fn page(&self, cmd: PageOperationLogCmd) -> AppResult<(Vec<OperationLog>, i64)> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository
            .page(&OperationLogPageQuery {
                filter: build_filter(
                    cmd.keyword,
                    cmd.tenant_id,
                    cmd.operator_id,
                    cmd.module,
                    cmd.biz_type,
                    cmd.biz_id,
                    cmd.operation,
                    cmd.result,
                    cmd.trace_id,
                    cmd.created_from,
                    cmd.created_to,
                ),
                limit: cmd.limit,
                offset: cmd.offset,
            })
            .await
    }

    async fn list(&self, cmd: ListOperationLogCmd) -> AppResult<Vec<OperationLog>> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository
            .list(&OperationLogListQuery {
                filter: build_filter(
                    cmd.keyword,
                    cmd.tenant_id,
                    cmd.operator_id,
                    cmd.module,
                    cmd.biz_type,
                    cmd.biz_id,
                    cmd.operation,
                    cmd.result,
                    cmd.trace_id,
                    cmd.created_from,
                    cmd.created_to,
                ),
                limit: cmd.limit,
            })
            .await
    }
}

#[allow(clippy::too_many_arguments)]
fn build_filter(
    keyword: Option<String>,
    tenant_id: Option<i64>,
    operator_id: Option<i64>,
    module: Option<String>,
    biz_type: Option<String>,
    biz_id: Option<i64>,
    operation: Option<String>,
    result: Option<i16>,
    trace_id: Option<String>,
    created_from: Option<chrono::DateTime<chrono::Utc>>,
    created_to: Option<chrono::DateTime<chrono::Utc>>,
) -> OperationLogFilter {
    OperationLogFilter {
        keyword,
        tenant_id,
        operator_id,
        module,
        biz_type,
        biz_id,
        operation,
        result,
        trace_id,
        created_from,
        created_to,
    }
}
