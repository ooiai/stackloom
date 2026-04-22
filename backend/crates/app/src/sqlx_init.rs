use std::sync::Arc;

use common::config::env_config;
use neocrates::sqlxhelper::pool::SqlxPool;
use neocrates::tracing;

pub struct SqlxInit;

impl SqlxInit {
    pub async fn init(config: env_config::DatabaseConfig) -> Arc<SqlxPool> {
        let pool: Arc<SqlxPool> = Arc::new(
            SqlxPool::new(&config.url, config.max_size as u32)
                .await
                .expect(&format!(
                    "...Init Failed to create Sqlx pool url:{}...",
                    config.url
                )),
        );
        let _ = match pool.health_check().await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("...Main Sqlx Pool Health Check Failed: {}...", e)),
        };
        tracing::info!("Sqlx pool initialized successfully url:{}", config.url);
        pool
    }
}
