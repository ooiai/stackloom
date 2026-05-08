use std::sync::Arc;

use domain_system::{AuditLog, AuditLogFilter, AuditLogPageQuery, AuditLogRepository};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Postgres, QueryBuilder};

use super::AuditLogRow;

#[derive(Debug, Clone)]
pub struct SqlxAuditLogRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxAuditLogRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }

    fn apply_filter<'a>(builder: &mut QueryBuilder<'a, Postgres>, filter: &'a AuditLogFilter) {
        if let Some(trace_id) = filter.trace_id.as_ref() {
            builder.push(" AND trace_id = ");
            builder.push_bind(trace_id.trim());
        }

        if let Some(tenant_id) = filter.tenant_id {
            builder.push(" AND tenant_id = ");
            builder.push_bind(tenant_id);
        }

        if let Some(operator_id) = filter.operator_id {
            builder.push(" AND operator_id = ");
            builder.push_bind(operator_id);
        }

        if let Some(target_type) = filter.target_type.as_ref() {
            builder.push(" AND target_type ILIKE ");
            builder.push_bind(format!("%{}%", target_type.trim()));
        }

        if let Some(target_id) = filter.target_id.as_ref() {
            builder.push(" AND target_id = ");
            builder.push_bind(target_id.trim());
        }

        if let Some(action) = filter.action.as_ref() {
            builder.push(" AND action ILIKE ");
            builder.push_bind(format!("%{}%", action.trim()));
        }

        if let Some(result) = filter.result.as_ref() {
            builder.push(" AND result = ");
            builder.push_bind(result.trim());
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
impl AuditLogRepository for SqlxAuditLogRepository {
    async fn create(&self, log: &AuditLog) -> AppResult<AuditLog> {
        let row = sqlx::query_as::<_, AuditLogRow>(
            r#"
            INSERT INTO audit_logs (
                id,
                trace_id,
                tenant_id,
                operator_id,
                target_type,
                target_id,
                action,
                result,
                reason,
                before_data,
                after_data,
                ip,
                user_agent,
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
                $14
            )
            RETURNING
                id,
                trace_id,
                tenant_id,
                operator_id,
                target_type,
                target_id,
                action,
                result,
                reason,
                before_data,
                after_data,
                ip,
                user_agent,
                created_at
            "#,
        )
        .bind(log.id)
        .bind(&log.trace_id)
        .bind(log.tenant_id)
        .bind(log.operator_id)
        .bind(&log.target_type)
        .bind(&log.target_id)
        .bind(&log.action)
        .bind(&log.result)
        .bind(&log.reason)
        .bind(&log.before_data)
        .bind(&log.after_data)
        .bind(&log.ip)
        .bind(&log.user_agent)
        .bind(log.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn page(&self, query: &AuditLogPageQuery) -> AppResult<(Vec<AuditLog>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM audit_logs
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
                tenant_id,
                operator_id,
                target_type,
                target_id,
                action,
                result,
                reason,
                before_data,
                after_data,
                ip,
                user_agent,
                created_at
            FROM audit_logs
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

        let rows: Vec<AuditLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list(&self, filter: &AuditLogFilter) -> AppResult<Vec<AuditLog>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                trace_id,
                tenant_id,
                operator_id,
                target_type,
                target_id,
                action,
                result,
                reason,
                before_data,
                after_data,
                ip,
                user_agent,
                created_at
            FROM audit_logs
            WHERE 1 = 1
            "#,
        );
        Self::apply_filter(&mut builder, filter);
        builder.push(" ORDER BY created_at DESC, id DESC");

        let rows: Vec<AuditLogRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }
}
