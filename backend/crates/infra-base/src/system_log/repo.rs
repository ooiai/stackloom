use std::sync::Arc;

use chrono::{DateTime, Utc};
use domain_system::{SystemLog, SystemLogFilter, SystemLogPageQuery, SystemLogRepository};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Postgres, QueryBuilder};

use super::SystemLogRow;

#[derive(Debug, Clone)]
pub struct SqlxSystemLogRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxSystemLogRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }

    fn apply_filter<'a>(builder: &mut QueryBuilder<'a, Postgres>, filter: &'a SystemLogFilter) {
        if let Some(trace_id) = filter.trace_id.as_ref() {
            builder.push(" AND trace_id = ");
            builder.push_bind(trace_id.trim());
        }

        if let Some(request_id) = filter.request_id.as_ref() {
            builder.push(" AND request_id = ");
            builder.push_bind(request_id.trim());
        }

        if let Some(tenant_id) = filter.tenant_id {
            builder.push(" AND tenant_id = ");
            builder.push_bind(tenant_id);
        }

        if let Some(operator_id) = filter.operator_id {
            builder.push(" AND operator_id = ");
            builder.push_bind(operator_id);
        }

        if let Some(method) = filter.method.as_ref() {
            builder.push(" AND method = ");
            builder.push_bind(method.trim().to_ascii_uppercase());
        }

        if let Some(path) = filter.path.as_ref() {
            builder.push(" AND path ILIKE ");
            builder.push_bind(format!("%{}%", path.trim()));
        }

        if let Some(module) = filter.module.as_ref() {
            builder.push(" AND module ILIKE ");
            builder.push_bind(format!("%{}%", module.trim()));
        }

        if let Some(action) = filter.action.as_ref() {
            builder.push(" AND action ILIKE ");
            builder.push_bind(format!("%{}%", action.trim()));
        }

        if let Some(status_code) = filter.status_code {
            builder.push(" AND status_code = ");
            builder.push_bind(status_code);
        }

        if let Some(result) = filter.result.as_ref() {
            builder.push(" AND result = ");
            builder.push_bind(result.trim());
        }

        if let Some(error_code) = filter.error_code.as_ref() {
            builder.push(" AND error_code ILIKE ");
            builder.push_bind(format!("%{}%", error_code.trim()));
        }

        if let Some(created_at_start) = filter.created_at_start {
            builder.push(" AND created_at >= ");
            builder.push_bind(created_at_start);
        }

        if let Some(created_at_end) = filter.created_at_end {
            builder.push(" AND created_at <= ");
            builder.push_bind(created_at_end);
        }
    }
}

#[async_trait]
impl SystemLogRepository for SqlxSystemLogRepository {
    async fn create(&self, log: &SystemLog) -> AppResult<SystemLog> {
        let row = sqlx::query_as::<_, SystemLogRow>(
            r#"
            INSERT INTO system_logs (
                id,
                trace_id,
                request_id,
                tenant_id,
                operator_id,
                method,
                path,
                module,
                action,
                status_code,
                latency_ms,
                result,
                error_code,
                error_message,
                ip,
                user_agent,
                ext,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16,
                $17,
                $18
            )
            RETURNING
                id,
                trace_id,
                request_id,
                tenant_id,
                operator_id,
                method,
                path,
                module,
                action,
                status_code,
                latency_ms,
                result,
                error_code,
                error_message,
                ip,
                user_agent,
                ext,
                created_at
            "#,
        )
        .bind(log.id)
        .bind(&log.trace_id)
        .bind(&log.request_id)
        .bind(log.tenant_id)
        .bind(log.operator_id)
        .bind(&log.method)
        .bind(&log.path)
        .bind(&log.module)
        .bind(&log.action)
        .bind(log.status_code)
        .bind(log.latency_ms)
        .bind(&log.result)
        .bind(&log.error_code)
        .bind(&log.error_message)
        .bind(&log.ip)
        .bind(&log.user_agent)
        .bind(&log.ext)
        .bind(log.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn page(&self, query: &SystemLogPageQuery) -> AppResult<(Vec<SystemLog>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM system_logs
            WHERE 1 = 1
            "#,
        );
        Self::apply_filter(&mut count_builder, &query.filter);

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                trace_id,
                request_id,
                tenant_id,
                operator_id,
                method,
                path,
                module,
                action,
                status_code,
                latency_ms,
                result,
                error_code,
                error_message,
                ip,
                user_agent,
                ext,
                created_at
            FROM system_logs
            WHERE 1 = 1
            "#,
        );
        Self::apply_filter(&mut builder, &query.filter);
        builder.push(" ORDER BY created_at DESC, id DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<SystemLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list(&self, filter: &SystemLogFilter) -> AppResult<Vec<SystemLog>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                trace_id,
                request_id,
                tenant_id,
                operator_id,
                method,
                path,
                module,
                action,
                status_code,
                latency_ms,
                result,
                error_code,
                error_message,
                ip,
                user_agent,
                ext,
                created_at
            FROM system_logs
            WHERE 1 = 1
            "#,
        );
        Self::apply_filter(&mut builder, filter);
        builder.push(" ORDER BY created_at DESC, id DESC");

        let rows: Vec<SystemLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn delete_by_created_before(&self, cutoff: DateTime<Utc>) -> AppResult<i64> {
        let result = sqlx::query("DELETE FROM system_logs WHERE created_at < $1")
            .bind(cutoff)
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(result.rows_affected() as i64)
    }
}
