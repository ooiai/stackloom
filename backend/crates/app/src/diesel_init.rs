// use std::sync::Arc;

// use common::config::env_config;
// use neocrates::dieselhelper::pool::DieselPool;

// pub struct DieselInit;

// impl DieselInit {
//     pub async fn init(config: env_config::DatabaseConfig) -> Arc<DieselPool> {
//         let diesel_pool: Arc<DieselPool> = Arc::new(
//             DieselPool::new(&config.url, config.max_size as usize)
//                 .await
//                 .expect(&format!(
//                     "...Init Failed to create Diesel pool url:{}...",
//                     config.url
//                 )),
//         );
//         let _ = match diesel_pool.health_check().await {
//             Ok(_) => Ok(()),
//             Err(e) => Err(format!("...Main Diesel Pool Health Check Failed: {}...", e)),
//         };
//         diesel_pool
//     }
// }
