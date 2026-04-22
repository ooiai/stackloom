use std::sync::Arc;

use common::config::env_config;
use neocrates::rediscache::{RedisConfig, RedisPool};

pub struct RedisInit;

impl RedisInit {
    pub async fn init(config: env_config::RedisConfig) -> Arc<RedisPool> {
        let redis_config = RedisConfig {
            url: config.url,
            max_size: 10,
            min_idle: Some(1),
            connection_timeout: std::time::Duration::from_secs(5),
            idle_timeout: Some(std::time::Duration::from_secs(600)),
            max_lifetime: Some(std::time::Duration::from_secs(3600)),
        };
        let redis_pool: Arc<RedisPool> = Arc::new(
            RedisPool::new(redis_config)
                .await
                .expect("Init Failed to create Redis pool"),
        );
        redis_pool
    }
}
