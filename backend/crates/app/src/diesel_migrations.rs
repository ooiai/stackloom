// use std::sync::Arc;

// use common::config::env_config::EnvConfig;
// use neocrates::{
//     diesel::{self, Connection, PgConnection, RunQueryDsl},
//     diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations},
//     tracing,
// };

// // pub const BASE_MIGRATIONS: EmbeddedMigrations =
// //     embed_migrations!("../../schemas/dieselschema/migrations");

// // pub const EDU_MIGRATIONS: EmbeddedMigrations =
// //     embed_migrations!("../../schemas/eduschema/migrations");

// pub struct DieselMigrations;

// impl DieselMigrations {
//     pub async fn migrate(pg_url: &str, db_url: &str, migrations: EmbeddedMigrations) {
//         let db_name: &str = db_url.split('/').last().unwrap_or("topedu");
//         tracing::info!("Migrations completed successfully db_name {}", db_name);
//         let mut pg_conn = PgConnection::establish(pg_url).expect(&format!(
//             "Failed to establish connection (pg_conn) db_name:{}",
//             db_name
//         ));
//         let create_sql = format!("CREATE DATABASE {}", db_name);
//         let _ = diesel::sql_query(create_sql).execute(&mut pg_conn);
//         let mut conn = PgConnection::establish(&db_url).expect(&format!(
//             "Failed to establish connection (db_url) db_name:{}",
//             db_name
//         ));
//         conn.run_pending_migrations(migrations)
//             .map(|applied| {
//                 for m in applied {
//                     println!("Applied migration: {}", m.to_string());
//                 }
//             })
//             .expect("Failed to run migrations");
//         tracing::info!("Migrations completed successfully at {}", db_url);
//     }

//     pub async fn init(config: Arc<EnvConfig>) {
//         // Initialize base database migrations
//         DieselMigrations::migrate(
//             &config.pg_database.url,
//             &config.base_database.url,
//             BASE_MIGRATIONS,
//         )
//         .await;

//         // Initialize EDU database migrations
//         DieselMigrations::migrate(
//             &config.pg_database.url,
//             &config.edu_database.url,
//             EDU_MIGRATIONS,
//         )
//         .await;
//     }
// }
