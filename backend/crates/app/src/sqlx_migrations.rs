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
        let _ = config;

        // `SqlxPool::new(...)` in neocrates already ensures the target database
        // exists before connecting, so migration init only needs to run the
        // configured migrator against the provided pool.
        let mut base_migrator = sqlx::migrate!("../../migrations/basemigrate");
        base_migrator.set_ignore_missing(true);
        Self::migrate(pool, &base_migrator).await;

        let mut web_migrator = sqlx::migrate!("../../migrations/webmigrate");
        web_migrator.set_ignore_missing(true);
        Self::migrate(pool, &web_migrator).await;

        tracing::info!("Sqlx base/web migrations initialized successfully");
    }
}
