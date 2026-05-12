use std::sync::Arc;

use domain_base::{
    ActiveUsersPoint, DailyOperationPoint, FunnelStep, OperationByModule, RetentionCohort,
    StatsBehaviorView, StatsFunnelView, StatsGrowthView, StatsOverviewView, StatsQueryCmd,
    StatsRetentionView, StatsService, TopOperator, UserGrowthPoint,
};
use neocrates::{
    async_trait::async_trait,
    response::error::AppResult,
    sqlx::{self, Row},
    sqlxhelper::pool::SqlxPool,
};

#[derive(Clone)]
pub struct StatsServiceImpl {
    pool: Arc<SqlxPool>,
}

impl StatsServiceImpl {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl StatsService for StatsServiceImpl {
    async fn get_overview(&self, cmd: StatsQueryCmd) -> AppResult<StatsOverviewView> {
        let pool = self.pool.pool();
        let days = cmd.days.max(7) as i64;

        let total_users: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let new_users_today: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day'",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let dau: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT user_id) FROM user_login_events WHERE created_at >= NOW() - INTERVAL '1 day'",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let wau: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT user_id) FROM user_login_events WHERE created_at >= NOW() - INTERVAL '7 days'",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let mau: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT user_id) FROM user_login_events WHERE created_at >= NOW() - INTERVAL '30 days'",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let active_tenants: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL AND status = 1",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let pending_applies: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM user_tenants WHERE is_tenant_admin = TRUE AND status = 2",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let growth_rows = sqlx::query(
            r#"
            WITH date_series AS (
                SELECT generate_series(
                    (NOW() - ($1::bigint || ' days')::interval)::date,
                    NOW()::date,
                    '1 day'::interval
                )::date AS day
            ),
            daily_new AS (
                SELECT created_at::date AS day, COUNT(*) AS cnt
                FROM users
                WHERE deleted_at IS NULL
                  AND created_at >= NOW() - ($1::bigint || ' days')::interval
                GROUP BY 1
            )
            SELECT
                ds.day::text AS date,
                COALESCE(dn.cnt, 0) AS new_users,
                SUM(COALESCE(dn.cnt, 0)) OVER (ORDER BY ds.day)::bigint AS cumulative
            FROM date_series ds
            LEFT JOIN daily_new dn ON ds.day = dn.day
            ORDER BY ds.day
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let user_growth_trend: Vec<UserGrowthPoint> = growth_rows
            .iter()
            .map(|r| UserGrowthPoint {
                date: r.get::<String, _>("date"),
                new_users: r.get::<i64, _>("new_users"),
                cumulative: r.get::<i64, _>("cumulative"),
            })
            .collect();

        let active_rows = sqlx::query(
            r#"
            WITH date_series AS (
                SELECT generate_series(
                    (NOW() - ($1::bigint || ' days')::interval)::date,
                    NOW()::date,
                    '1 day'::interval
                )::date AS day
            ),
            daily_active AS (
                SELECT created_at::date AS day, COUNT(DISTINCT user_id) AS cnt
                FROM user_login_events
                WHERE created_at >= NOW() - ($1::bigint || ' days')::interval
                GROUP BY 1
            )
            SELECT
                ds.day::text AS date,
                COALESCE(da.cnt, 0) AS dau
            FROM date_series ds
            LEFT JOIN daily_active da ON ds.day = da.day
            ORDER BY ds.day
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let active_users_trend: Vec<ActiveUsersPoint> = active_rows
            .iter()
            .map(|r| ActiveUsersPoint {
                date: r.get::<String, _>("date"),
                dau: r.get::<i64, _>("dau"),
            })
            .collect();

        Ok(StatsOverviewView {
            total_users,
            new_users_today,
            dau,
            wau,
            mau,
            active_tenants,
            pending_applies,
            user_growth_trend,
            active_users_trend,
        })
    }

    async fn get_growth(&self, cmd: StatsQueryCmd) -> AppResult<StatsGrowthView> {
        let pool = self.pool.pool();
        let days = cmd.days.max(7) as i64;

        let rows = sqlx::query(
            r#"
            WITH date_series AS (
                SELECT generate_series(
                    (NOW() - ($1::bigint || ' days')::interval)::date,
                    NOW()::date,
                    '1 day'::interval
                )::date AS day
            ),
            daily_new AS (
                SELECT created_at::date AS day, COUNT(*) AS cnt
                FROM users
                WHERE deleted_at IS NULL
                  AND created_at >= NOW() - ($1::bigint || ' days')::interval
                GROUP BY 1
            )
            SELECT
                ds.day::text AS date,
                COALESCE(dn.cnt, 0) AS new_users,
                (
                    SELECT COUNT(*) FROM users
                    WHERE deleted_at IS NULL AND created_at::date <= ds.day
                ) AS cumulative
            FROM date_series ds
            LEFT JOIN daily_new dn ON ds.day = dn.day
            ORDER BY ds.day
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let items: Vec<UserGrowthPoint> = rows
            .iter()
            .map(|r| UserGrowthPoint {
                date: r.get::<String, _>("date"),
                new_users: r.get::<i64, _>("new_users"),
                cumulative: r.get::<i64, _>("cumulative"),
            })
            .collect();

        Ok(StatsGrowthView { items })
    }

    async fn get_retention(&self, cmd: StatsQueryCmd) -> AppResult<StatsRetentionView> {
        let pool = self.pool.pool();
        let days = cmd.days.max(30) as i64;

        let rows = sqlx::query(
            r#"
            WITH cohort AS (
                SELECT
                    DATE_TRUNC('week', u.created_at)::date AS cohort_date,
                    u.id AS user_id,
                    u.created_at
                FROM users u
                WHERE u.deleted_at IS NULL
                  AND u.created_at >= NOW() - ($1::bigint || ' days')::interval
            )
            SELECT
                c.cohort_date::text AS cohort_date,
                COUNT(DISTINCT c.user_id) AS new_users,
                COUNT(DISTINCT ule1.user_id) FILTER (
                    WHERE ule1.created_at >= c.created_at + INTERVAL '1 day'
                      AND ule1.created_at <  c.created_at + INTERVAL '2 days'
                ) AS d1_count,
                COUNT(DISTINCT ule7.user_id) FILTER (
                    WHERE ule7.created_at >= c.created_at + INTERVAL '7 days'
                      AND ule7.created_at <  c.created_at + INTERVAL '8 days'
                ) AS d7_count,
                COUNT(DISTINCT ule30.user_id) FILTER (
                    WHERE ule30.created_at >= c.created_at + INTERVAL '30 days'
                      AND ule30.created_at <  c.created_at + INTERVAL '31 days'
                ) AS d30_count
            FROM cohort c
            LEFT JOIN user_login_events ule1  ON ule1.user_id  = c.user_id
            LEFT JOIN user_login_events ule7  ON ule7.user_id  = c.user_id
            LEFT JOIN user_login_events ule30 ON ule30.user_id = c.user_id
            GROUP BY c.cohort_date
            ORDER BY c.cohort_date DESC
            LIMIT 12
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let cohorts: Vec<RetentionCohort> = rows
            .iter()
            .map(|r| {
                let new_users: i64 = r.get("new_users");
                let d1: i64 = r.get("d1_count");
                let d7: i64 = r.get("d7_count");
                let d30: i64 = r.get("d30_count");
                RetentionCohort {
                    cohort_date: r.get("cohort_date"),
                    new_users,
                    d1_rate: if new_users > 0 { Some(d1 as f64 / new_users as f64) } else { None },
                    d7_rate: if new_users > 0 { Some(d7 as f64 / new_users as f64) } else { None },
                    d30_rate: if new_users > 0 { Some(d30 as f64 / new_users as f64) } else { None },
                }
            })
            .collect();

        Ok(StatsRetentionView { cohorts })
    }

    async fn get_behavior(&self, cmd: StatsQueryCmd) -> AppResult<StatsBehaviorView> {
        let pool = self.pool.pool();
        let days = cmd.days.max(7) as i64;

        let module_rows = sqlx::query(
            r#"
            SELECT
                COALESCE(module, 'unknown') AS module,
                COUNT(*) AS count
            FROM operation_logs
            WHERE created_at >= NOW() - ($1::bigint || ' days')::interval
            GROUP BY module
            ORDER BY count DESC
            LIMIT 15
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let operation_by_module: Vec<OperationByModule> = module_rows
            .iter()
            .map(|r| OperationByModule {
                module: r.get::<String, _>("module"),
                count: r.get::<i64, _>("count"),
            })
            .collect();

        let trend_rows = sqlx::query(
            r#"
            WITH date_series AS (
                SELECT generate_series(
                    (NOW() - ($1::bigint || ' days')::interval)::date,
                    NOW()::date,
                    '1 day'::interval
                )::date AS day
            ),
            daily_ops AS (
                SELECT created_at::date AS day, COUNT(*) AS cnt
                FROM operation_logs
                WHERE created_at >= NOW() - ($1::bigint || ' days')::interval
                GROUP BY 1
            )
            SELECT ds.day::text AS date, COALESCE(do_.cnt, 0) AS count
            FROM date_series ds
            LEFT JOIN daily_ops do_ ON ds.day = do_.day
            ORDER BY ds.day
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let daily_trend: Vec<DailyOperationPoint> = trend_rows
            .iter()
            .map(|r| DailyOperationPoint {
                date: r.get::<String, _>("date"),
                count: r.get::<i64, _>("count"),
            })
            .collect();

        let top_rows = sqlx::query(
            r#"
            SELECT
                ol.operator_id::text AS operator_id,
                COALESCE(ol.operator, 'unknown') AS operator_name,
                COUNT(*) AS count
            FROM operation_logs ol
            WHERE ol.created_at >= NOW() - ($1::bigint || ' days')::interval
              AND ol.operator_id IS NOT NULL
            GROUP BY ol.operator_id, ol.operator
            ORDER BY count DESC
            LIMIT 10
            "#,
        )
        .bind(days)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        let top_operators: Vec<TopOperator> = top_rows
            .iter()
            .map(|r| TopOperator {
                operator_id: r.get::<String, _>("operator_id"),
                operator_name: r.get::<String, _>("operator_name"),
                count: r.get::<i64, _>("count"),
            })
            .collect();

        Ok(StatsBehaviorView {
            operation_by_module,
            daily_trend,
            top_operators,
        })
    }

    async fn get_funnel(&self) -> AppResult<StatsFunnelView> {
        let pool = self.pool.pool();

        let total_registered: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")
                .fetch_one(pool)
                .await
                .unwrap_or(0);

        let ever_logged_in: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT user_id) FROM user_login_events",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let ever_operated: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT operator_id) FROM operation_logs WHERE operator_id IS NOT NULL",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let activated: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT user_id) FROM user_tenants WHERE status = 1",
        )
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let base = if total_registered > 0 { total_registered as f64 } else { 1.0 };

        let steps = vec![
            FunnelStep {
                step: "registered".to_string(),
                count: total_registered,
                rate: 1.0,
            },
            FunnelStep {
                step: "logged_in".to_string(),
                count: ever_logged_in,
                rate: ever_logged_in as f64 / base,
            },
            FunnelStep {
                step: "operated".to_string(),
                count: ever_operated,
                rate: ever_operated as f64 / base,
            },
            FunnelStep {
                step: "activated".to_string(),
                count: activated,
                rate: activated as f64 / base,
            },
        ];

        Ok(StatsFunnelView { steps })
    }
}
