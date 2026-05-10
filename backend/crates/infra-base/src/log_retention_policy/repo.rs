use chrono::Utc;
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use std::sync::Arc;

use domain_base::{LogRetentionPolicy, LogRetentionPolicyRepository};

pub struct SqlxLogRetentionPolicyRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxLogRetentionPolicyRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl LogRetentionPolicyRepository for SqlxLogRetentionPolicyRepository {
    async fn get(&self, log_type: &str) -> AppResult<Option<LogRetentionPolicy>> {
        let policy = sqlx::query_as::<_, (i64, String, Option<i32>, Option<chrono::DateTime<Utc>>)>(
            "SELECT id, log_type, retention_days, last_cleanup_at FROM log_retention_policies WHERE log_type = $1"
        )
        .bind(log_type)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(policy.map(
            |(id, log_type, retention_days, last_cleanup_at)| LogRetentionPolicy {
                id,
                log_type,
                retention_days,
                last_cleanup_at,
            },
        ))
    }

    async fn update(
        &self,
        log_type: &str,
        retention_days: Option<i32>,
    ) -> AppResult<LogRetentionPolicy> {
        let now = Utc::now();
        let policy = sqlx::query_as::<_, (i64, String, Option<i32>, Option<chrono::DateTime<Utc>>)>(
            "UPDATE log_retention_policies SET retention_days = $1, updated_at = $2 WHERE log_type = $3 RETURNING id, log_type, retention_days, last_cleanup_at"
        )
        .bind(retention_days)
        .bind(now)
        .bind(log_type)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(LogRetentionPolicy {
            id: policy.0,
            log_type: policy.1,
            retention_days: policy.2,
            last_cleanup_at: policy.3,
        })
    }

    async fn list(&self) -> AppResult<Vec<LogRetentionPolicy>> {
        let policies = sqlx::query_as::<_, (i64, String, Option<i32>, Option<chrono::DateTime<Utc>>)>(
            "SELECT id, log_type, retention_days, last_cleanup_at FROM log_retention_policies ORDER BY log_type"
        )
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(policies
            .into_iter()
            .map(
                |(id, log_type, retention_days, last_cleanup_at)| LogRetentionPolicy {
                    id,
                    log_type,
                    retention_days,
                    last_cleanup_at,
                },
            )
            .collect())
    }
}
