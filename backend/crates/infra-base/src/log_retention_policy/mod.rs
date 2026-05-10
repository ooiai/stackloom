use chrono::Utc;
use neocrates::response::error::AppResult;
use sqlx::PgPool;

use domain_base::LogRetentionPolicyRepository;

pub struct LogRetentionService {
    policy_repo: Box<dyn LogRetentionPolicyRepository>,
    pool: PgPool,
}

impl LogRetentionService {
    pub fn new(policy_repo: Box<dyn LogRetentionPolicyRepository>, pool: PgPool) -> Self {
        Self { policy_repo, pool }
    }

    pub async fn cleanup_all_logs(&self) -> AppResult<()> {
        let policies = self.policy_repo.list().await?;

        for policy in policies {
            if let Some(days) = policy.retention_days {
                let cutoff_date = Utc::now() - chrono::Duration::days(days as i64);

                match policy.log_type.as_str() {
                    "system_log" => {
                        sqlx::query("DELETE FROM system_logs WHERE created_at < $1")
                            .bind(cutoff_date)
                            .execute(&self.pool)
                            .await
                            .map_err(|e| {
                                neocrates::response::error::AppError::data_here(e.to_string())
                            })?;
                    }
                    "audit_log" => {
                        sqlx::query("DELETE FROM audit_logs WHERE created_at < $1")
                            .bind(cutoff_date)
                            .execute(&self.pool)
                            .await
                            .map_err(|e| {
                                neocrates::response::error::AppError::data_here(e.to_string())
                            })?;
                    }
                    "operation_log" => {
                        sqlx::query("DELETE FROM operation_logs WHERE created_at < $1")
                            .bind(cutoff_date)
                            .execute(&self.pool)
                            .await
                            .map_err(|e| {
                                neocrates::response::error::AppError::data_here(e.to_string())
                            })?;
                    }
                    _ => {}
                }

                // Update last_cleanup_at
                sqlx::query(
                    "UPDATE log_retention_policies SET last_cleanup_at = $1 WHERE log_type = $2",
                )
                .bind(Utc::now())
                .bind(&policy.log_type)
                .execute(&self.pool)
                .await
                .map_err(|e| neocrates::response::error::AppError::data_here(e.to_string()))?;
            }
        }

        Ok(())
    }
}

pub mod repo;
