use std::sync::Arc;

use domain_system::{
    AppStats, BusinessSummary, DatabaseStats, DatabaseTopQuery, ErrorEndpoint, HourlyRequestStat,
    MonitorRepository, PgStatStatementsStats, SlowEndpoint, StatusDistribution,
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::Row;

#[derive(Clone)]
pub struct SqlxMonitorRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxMonitorRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }

    fn sql_state(err: &sqlx::Error) -> Option<String> {
        err.as_database_error()
            .and_then(|db_err| db_err.code().map(|code| code.to_string()))
    }

    async fn fetch_pg_stat_statements_queries(
        &self,
        order_by_total: bool,
    ) -> Result<Vec<DatabaseTopQuery>, sqlx::Error> {
        let new_columns = if order_by_total {
            ("total_exec_time", "mean_exec_time", "total_exec_time")
        } else {
            ("total_exec_time", "mean_exec_time", "mean_exec_time")
        };

        match self
            .fetch_pg_stat_statements_queries_with_columns(new_columns)
            .await
        {
            Ok(rows) => Ok(rows),
            Err(err) if Self::sql_state(&err).as_deref() == Some("42703") => {
                let old_columns = if order_by_total {
                    ("total_time", "mean_time", "total_time")
                } else {
                    ("total_time", "mean_time", "mean_time")
                };
                self.fetch_pg_stat_statements_queries_with_columns(old_columns)
                    .await
            }
            Err(err) => Err(err),
        }
    }

    async fn fetch_pg_stat_statements_queries_with_columns(
        &self,
        columns: (&str, &str, &str),
    ) -> Result<Vec<DatabaseTopQuery>, sqlx::Error> {
        let (total_col, mean_col, order_col) = columns;
        let sql = format!(
            r#"
            SELECT
                LEFT(
                    REPLACE(REPLACE(REPLACE(query, E'\n', ' '), E'\r', ' '), E'\t', ' '),
                    500
                ) AS query,
                calls::bigint,
                {total_col}::double precision AS total_exec_time_ms,
                {mean_col}::double precision AS mean_exec_time_ms,
                rows::bigint,
                COALESCE(shared_blks_hit, 0)::bigint AS shared_blks_hit,
                COALESCE(shared_blks_read, 0)::bigint AS shared_blks_read
            FROM pg_stat_statements s
            JOIN pg_database d ON d.oid = s.dbid
            WHERE d.datname = current_database()
            ORDER BY {order_col} DESC
            LIMIT 5
            "#
        );

        let rows: Vec<(String, i64, f64, f64, i64, i64, i64)> = sqlx::query_as(&sql)
            .fetch_all(self.pool.pool())
            .await?;

        Ok(rows
            .into_iter()
            .map(
                |(
                    query,
                    calls,
                    total_exec_time_ms,
                    mean_exec_time_ms,
                    rows,
                    shared_blks_hit,
                    shared_blks_read,
                )| DatabaseTopQuery {
                    query,
                    calls,
                    total_exec_time_ms,
                    mean_exec_time_ms,
                    rows,
                    shared_blks_hit,
                    shared_blks_read,
                },
            )
            .collect())
    }

    async fn get_pg_stat_statements_stats(&self) -> PgStatStatementsStats {
        let installed = sqlx::query("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')")
            .fetch_one(self.pool.pool())
            .await
            .ok()
            .and_then(|row| row.try_get::<bool, _>(0).ok())
            .unwrap_or(false);

        if !installed {
            return PgStatStatementsStats {
                available: false,
                unavailable_reason_key: Some("monitor.db_pgss_not_installed".to_string()),
                top_by_total_time: Vec::new(),
                top_by_mean_time: Vec::new(),
            };
        }

        let top_by_total_time = match self.fetch_pg_stat_statements_queries(true).await {
            Ok(rows) => rows,
            Err(err) => {
                return PgStatStatementsStats {
                    available: false,
                    unavailable_reason_key: Some(match Self::sql_state(&err).as_deref() {
                        Some("42501") => "monitor.db_pgss_permission_denied",
                        Some("55000") => "monitor.db_pgss_not_loaded",
                        Some("42P01") => "monitor.db_pgss_not_installed",
                        Some("42703") => "monitor.db_pgss_unsupported_version",
                        _ => "monitor.db_pgss_query_failed",
                    }
                    .to_string()),
                    top_by_total_time: Vec::new(),
                    top_by_mean_time: Vec::new(),
                };
            }
        };

        let top_by_mean_time = match self.fetch_pg_stat_statements_queries(false).await {
            Ok(rows) => rows,
            Err(err) => {
                return PgStatStatementsStats {
                    available: false,
                    unavailable_reason_key: Some(match Self::sql_state(&err).as_deref() {
                        Some("42501") => "monitor.db_pgss_permission_denied",
                        Some("55000") => "monitor.db_pgss_not_loaded",
                        Some("42P01") => "monitor.db_pgss_not_installed",
                        Some("42703") => "monitor.db_pgss_unsupported_version",
                        _ => "monitor.db_pgss_query_failed",
                    }
                    .to_string()),
                    top_by_total_time: Vec::new(),
                    top_by_mean_time: Vec::new(),
                };
            }
        };

        PgStatStatementsStats {
            available: true,
            unavailable_reason_key: None,
            top_by_total_time,
            top_by_mean_time,
        }
    }
}

#[async_trait]
impl MonitorRepository for SqlxMonitorRepository {
    async fn get_request_stats(&self) -> AppResult<Vec<HourlyRequestStat>> {
        let rows: Vec<(Option<chrono::DateTime<chrono::Utc>>, i64, i64, f64)> = sqlx::query_as(
            r#"
            SELECT
                date_trunc('hour', created_at),
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE result = 'error')::bigint,
                COALESCE(AVG(latency_ms::double precision), 0.0)
            FROM system_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY date_trunc('hour', created_at)
            ORDER BY date_trunc('hour', created_at) ASC
            "#,
        )
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows
            .into_iter()
            .map(|(hour, total, errors, avg_latency_ms)| HourlyRequestStat {
                hour: hour.map(|h| h.to_rfc3339()).unwrap_or_default(),
                total,
                errors,
                avg_latency_ms,
            })
            .collect())
    }

    async fn get_app_stats(&self) -> AppResult<AppStats> {
        let row: (i64, i64, f64, f64) = sqlx::query_as(
            r#"
            SELECT
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE result <> 'error')::bigint,
                COALESCE(
                    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms::double precision),
                    0.0
                ),
                COALESCE(
                    percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms::double precision),
                    0.0
                )
            FROM system_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            "#,
        )
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        let (total, success, p95, p99) = row;
        let success_rate = if total > 0 {
            (success as f64 / total as f64) * 100.0
        } else {
            100.0
        };

        Ok(AppStats {
            success_rate,
            p95_latency_ms: p95,
            p99_latency_ms: p99,
        })
    }

    async fn get_top_slow_endpoints(&self) -> AppResult<Vec<SlowEndpoint>> {
        let rows: Vec<(String, f64, i64)> = sqlx::query_as(
            r#"
            SELECT
                path,
                AVG(latency_ms::double precision) AS avg_latency_ms,
                COUNT(*)::bigint AS request_count
            FROM system_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY path
            ORDER BY avg_latency_ms DESC
            LIMIT 5
            "#,
        )
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows
            .into_iter()
            .map(|(path, avg_latency_ms, request_count)| SlowEndpoint {
                path,
                avg_latency_ms,
                request_count,
            })
            .collect())
    }

    async fn get_top_error_endpoints(&self) -> AppResult<Vec<ErrorEndpoint>> {
        let rows: Vec<(String, i64, i64)> = sqlx::query_as(
            r#"
            SELECT
                path,
                COUNT(*) FILTER (WHERE result = 'error')::bigint AS error_count,
                COUNT(*)::bigint AS total_count
            FROM system_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY path
            HAVING COUNT(*) FILTER (WHERE result = 'error') > 0
            ORDER BY error_count DESC
            LIMIT 5
            "#,
        )
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows
            .into_iter()
            .map(|(path, error_count, total_count)| ErrorEndpoint {
                path,
                error_count,
                total_count,
            })
            .collect())
    }

    async fn get_status_distribution(&self) -> AppResult<Vec<StatusDistribution>> {
        let rows: Vec<(Option<chrono::DateTime<chrono::Utc>>, i64, i64, i64)> = sqlx::query_as(
            r#"
            SELECT
                date_trunc('hour', created_at),
                COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299)::bigint AS ok_2xx,
                COUNT(*) FILTER (WHERE status_code BETWEEN 400 AND 499)::bigint AS err_4xx,
                COUNT(*) FILTER (WHERE status_code BETWEEN 500 AND 599)::bigint AS err_5xx
            FROM system_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY date_trunc('hour', created_at)
            ORDER BY date_trunc('hour', created_at) ASC
            "#,
        )
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows
            .into_iter()
            .map(|(hour, ok_2xx, err_4xx, err_5xx)| StatusDistribution {
                hour: hour.map(|h| h.to_rfc3339()).unwrap_or_default(),
                ok_2xx,
                err_4xx,
                err_5xx,
            })
            .collect())
    }

    async fn get_business_summary(&self) -> AppResult<BusinessSummary> {
        let (total_users,): (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM users")
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let (total_tenants,): (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM tenants")
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let (total_roles,): (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM roles")
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(BusinessSummary {
            total_users,
            total_tenants,
            total_roles,
        })
    }

    async fn get_database_stats(&self) -> AppResult<DatabaseStats> {
        let activity: (i64, i64, i64, i64, i64, i64) = sqlx::query_as(
            r#"
            SELECT
                COUNT(*) FILTER (WHERE backend_type = 'client backend')::bigint AS connections_total,
                COUNT(*) FILTER (
                    WHERE backend_type = 'client backend'
                      AND state = 'active'
                      AND pid <> pg_backend_pid()
                )::bigint AS connections_active,
                COUNT(*) FILTER (
                    WHERE backend_type = 'client backend'
                      AND state IN (
                        'idle',
                        'idle in transaction',
                        'idle in transaction (aborted)',
                        'disabled'
                      )
                )::bigint AS connections_idle,
                COUNT(*) FILTER (
                    WHERE backend_type = 'client backend'
                      AND state = 'active'
                      AND wait_event_type IS NOT NULL
                      AND pid <> pg_backend_pid()
                )::bigint AS connections_waiting,
                COUNT(*) FILTER (
                    WHERE backend_type = 'client backend'
                      AND cardinality(pg_blocking_pids(pid)) > 0
                      AND pid <> pg_backend_pid()
                )::bigint AS blocked_queries,
                COALESCE(
                    MAX(EXTRACT(EPOCH FROM (NOW() - query_start))) FILTER (
                        WHERE backend_type = 'client backend'
                          AND state = 'active'
                          AND pid <> pg_backend_pid()
                    ),
                    0
                )::bigint AS longest_running_query_secs
            FROM pg_stat_activity
            WHERE datname = current_database()
            "#,
        )
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        let health: (
            Option<chrono::DateTime<chrono::Utc>>,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
            i64,
        ) = sqlx::query_as(
            r#"
            SELECT
                stats_reset,
                xact_commit::bigint,
                xact_rollback::bigint,
                blks_hit::bigint,
                blks_read::bigint,
                deadlocks::bigint,
                temp_files::bigint,
                temp_bytes::bigint,
                tup_returned::bigint,
                tup_fetched::bigint,
                tup_inserted::bigint,
                tup_updated::bigint,
                tup_deleted::bigint
            FROM pg_stat_database
            WHERE datname = current_database()
            "#,
        )
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        let (db_size_bytes,): (i64,) =
            sqlx::query_as("SELECT pg_database_size(current_database())::bigint")
                .fetch_one(self.pool.pool())
                .await
                .map_err(Self::map_sqlx_error)?;

        let (
            stats_reset_at,
            commits,
            rollbacks,
            blks_hit,
            blks_read,
            deadlocks,
            temp_files,
            temp_bytes,
            rows_returned,
            rows_fetched,
            rows_inserted,
            rows_updated,
            rows_deleted,
        ) = health;

        let cache_hit_rate = if blks_hit + blks_read > 0 {
            (blks_hit as f64 / (blks_hit + blks_read) as f64) * 100.0
        } else {
            100.0
        };

        Ok(DatabaseStats {
            pool_size: 0,
            pool_idle: 0,
            pool_active: 0,
            pool_utilization_rate: 0.0,
            connections_total: activity.0,
            connections_active: activity.1,
            connections_idle: activity.2,
            connections_waiting: activity.3,
            blocked_queries: activity.4,
            longest_running_query_secs: activity.5,
            stats_reset_at: stats_reset_at.map(|value| value.to_rfc3339()),
            commits,
            rollbacks,
            cache_hit_rate,
            deadlocks,
            temp_files,
            temp_bytes,
            db_size_bytes,
            rows_returned,
            rows_fetched,
            rows_inserted,
            rows_updated,
            rows_deleted,
            pg_stat_statements: self.get_pg_stat_statements_stats().await,
        })
    }
}
