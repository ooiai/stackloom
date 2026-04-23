use api_http::{BaseHttpState, user_routes};
use common::config::env_config::EnvConfig;

use neocrates::{
    axum::{self, Router, http::HeaderValue, routing::get},
    hyper::{
        Method, StatusCode,
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    },
    rediscache::RedisPool,
    tokio::net::TcpListener,
    tower::ServiceBuilder,
    tower_http::{cors::CorsLayer, trace::TraceLayer},
    tracing,
};
use std::sync::Arc;

use crate::{
    redis_init::RedisInit, sms_init::SmsInit, sqlx_init::SqlxInit, sqlx_migrations::SqlxMigrations,
};
use infra_base::UserServiceImpl;

mod diesel_init;
mod diesel_migrations;
mod redis_init;
mod sms_init;
mod sqlx_init;
mod sqlx_migrations;

/// Start the HTTP server
///
/// # Arguments
///
/// * `cfg` - An Arc pointer to the environment configuration
///
pub async fn start_server(cfg: Arc<EnvConfig>) {
    tracing::info!("Monolith initialize base sqlx pool...");
    let base_pool = SqlxInit::init(cfg.base_database.clone()).await;

    tracing::info!("Monolith run base sqlx migrations...");
    SqlxMigrations::init(cfg.clone(), &base_pool).await;

    tracing::info!("Monolith load redis...");
    // initialize redis pool
    let _redis_pool: Arc<RedisPool> = RedisInit::init(cfg.redis.clone()).await;

    // build app state
    tracing::info!("Monolith build app state...");
    // the cors layer
    let cors = CorsLayer::new()
        .allow_origin(
            format!("http://{}:{}", cfg.server.host, cfg.server.port)
                .parse::<HeaderValue>()
                .expect("Failed to parse origin..."),
        )
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);
    // the trace layer
    let trace_layer = ServiceBuilder::new().layer(TraceLayer::new_for_http());
    // SMS Config initialization
    let _sms_config = SmsInit::init(cfg.clone());

    // build base http state
    let base_http_state = BaseHttpState {
        user_service: Arc::new(UserServiceImpl::new(base_pool.clone())),
    };

    let router = Router::new()
        .route("/ping", get(ping))
        .merge(user_routes(base_http_state))
        .fallback(handler_404)
        .layer(trace_layer)
        .layer(cors);
    let listener = TcpListener::bind(format!("{}:{}", cfg.server.host, cfg.server.port))
        .await
        .expect("TcpListener unable to bind port");
    tracing::info!(
        "Monolith start server success at host:{} port:{}...",
        cfg.server.host,
        cfg.server.port
    );
    axum::serve(listener, router)
        .await
        .expect("Axum server error");
}

pub async fn ping() -> Result<String, StatusCode> {
    Ok("The ping work well...".to_owned())
}

async fn handler_404() -> (StatusCode, &'static str) {
    (StatusCode::NOT_FOUND, "URL Not Found...")
}
