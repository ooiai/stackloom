use std::sync::Arc;

use chrono::{DateTime, Utc};
use domain_base::{
    OperationLog, OperationLogRepository,
    operation_log::{OperationLogFilter, OperationLogListQuery, OperationLogPageQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Postgres, QueryBuilder};

use super::OperationLogRow;

#[derive(Debug, Clone)]
pub struct SqlxOperationLogRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxOperationLogRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }

    fn apply_filters(builder: &mut QueryBuilder<'_, Postgres>, filter: &OperationLogFilter) {
        if let Some(tenant_id) = filter.tenant_id {
            builder.push(" AND tenant_id = ");
            builder.push_bind(tenant_id);
        }

        if let Some(operator_id) = filter.operator_id {
            builder.push(" AND operator_id = ");
            builder.push_bind(operator_id);
        }

        if let Some(module) = normalized_string(&filter.module) {
            builder.push(" AND module = ");
            builder.push_bind(module);
        }

        if let Some(biz_type) = normalized_string(&filter.biz_type) {
            builder.push(" AND biz_type = ");
            builder.push_bind(biz_type);
        }

        if let Some(biz_id) = filter.biz_id {
            builder.push(" AND biz_id = ");
            builder.push_bind(biz_id);
        }

        if let Some(operation) = normalized_string(&filter.operation) {
            builder.push(" AND operation = ");
            builder.push_bind(operation);
        }

        if let Some(result) = filter.result {
            builder.push(" AND result = ");
            builder.push_bind(result);
        }

        if let Some(trace_id) = normalized_string(&filter.trace_id) {
            builder.push(" AND trace_id = ");
            builder.push_bind(trace_id);
        }

        if let Some(created_from) = filter.created_from {
            builder.push(" AND created_at >= ");
            builder.push_bind(created_from);
        }

        if let Some(created_to) = filter.created_to {
            builder.push(" AND created_at <= ");
            builder.push_bind(created_to);
        }

        if let Some(keyword) = normalized_string(&filter.keyword) {
            let pattern = format!("%{keyword}%");
            builder.push(" AND (module ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR biz_type ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR operation ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR summary ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR trace_id ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR CAST(biz_id AS TEXT) ILIKE ");
            builder.push_bind(pattern);
            builder.push(")");
        }
    }
}

#[async_trait]
impl OperationLogRepository for SqlxOperationLogRepository {
    async fn create(&self, operation_log: &OperationLog) -> AppResult<OperationLog> {
        let row = sqlx::query_as::<_, OperationLogRow>(
            r#"
            INSERT INTO operation_logs (
                id,
                tenant_id,
                operator_id,
                module,
                biz_type,
                biz_id,
                operation,
                summary,
                result,
                before_snapshot,
                after_snapshot,
                trace_id,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING
                id,
                tenant_id,
                operator_id,
                module,
                biz_type,
                biz_id,
                operation,
                summary,
                result,
                before_snapshot,
                after_snapshot,
                trace_id,
                created_at
            "#,
        )
        .bind(operation_log.id)
        .bind(operation_log.tenant_id)
        .bind(operation_log.operator_id)
        .bind(&operation_log.module)
        .bind(&operation_log.biz_type)
        .bind(operation_log.biz_id)
        .bind(&operation_log.operation)
        .bind(&operation_log.summary)
        .bind(operation_log.result)
        .bind(&operation_log.before_snapshot)
        .bind(&operation_log.after_snapshot)
        .bind(&operation_log.trace_id)
        .bind(operation_log.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn page(&self, query: &OperationLogPageQuery) -> AppResult<(Vec<OperationLog>, i64)> {
        let mut count_builder = QueryBuilder::<Postgres>::new(
            r#"
            SELECT COUNT(*) AS total
            FROM operation_logs
            WHERE 1 = 1
            "#,
        );

        Self::apply_filters(&mut count_builder, &query.filter);

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::<Postgres>::new(
            r#"
            SELECT
                id,
                tenant_id,
                operator_id,
                module,
                biz_type,
                biz_id,
                operation,
                summary,
                result,
                before_snapshot,
                after_snapshot,
                trace_id,
                created_at
            FROM operation_logs
            WHERE 1 = 1
            "#,
        );

        Self::apply_filters(&mut builder, &query.filter);

        builder.push(" ORDER BY created_at DESC, id DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<OperationLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list(&self, query: &OperationLogListQuery) -> AppResult<Vec<OperationLog>> {
        let mut builder = QueryBuilder::<Postgres>::new(
            r#"
            SELECT
                id,
                tenant_id,
                operator_id,
                module,
                biz_type,
                biz_id,
                operation,
                summary,
                result,
                before_snapshot,
                after_snapshot,
                trace_id,
                created_at
            FROM operation_logs
            WHERE 1 = 1
            "#,
        );

        Self::apply_filters(&mut builder, &query.filter);

        builder.push(" ORDER BY created_at DESC, id DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        let rows: Vec<OperationLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn delete_by_created_before(&self, cutoff: DateTime<Utc>) -> AppResult<i64> {
        let result = sqlx::query("DELETE FROM operation_logs WHERE created_at < $1")
            .bind(cutoff)
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(result.rows_affected() as i64)
    }
}

fn normalized_string(value: &Option<String>) -> Option<String> {
    value
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}
