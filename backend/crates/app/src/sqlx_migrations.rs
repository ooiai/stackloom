use std::sync::Arc;

use common::config::env_config::EnvConfig;
use neocrates::{sqlxhelper::pool::SqlxPool, tracing};

pub struct SqlxMigrations;

impl SqlxMigrations {
    pub async fn migrate(pool: &SqlxPool, migrator: &sqlx::migrate::Migrator) {
        pool.run_migrations(migrator)
            .await
            .map(|_| {
                tracing::info!("Sqlx migrations completed successfully");
            })
            .expect("Failed to run Sqlx migrations");
    }

    pub async fn init(config: Arc<EnvConfig>, pool: &SqlxPool) {
        // Initialize base database migrations
        // let base_migrator = sqlx::migrate!("../../schemas/base/migrations");
        // SqlxMigrations::migrate(pool, &base_migrator).await;
        let _ = (config, pool);
        tracing::info!("Sqlx migrations init skipped (no migrators configured)");
    }
}
