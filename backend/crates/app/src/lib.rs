use api_http::{BaseHttpState, SysHttpState, base_router, system_router};
use common::config::env_config::EnvConfig;

use neocrates::{
    axum::{self, Router, http::HeaderValue, routing::get},
    hyper::{
        Method, StatusCode,
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    },
    middlewares::{models::MiddlewareConfig, token_store},
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
use infra_base::{
    DictServiceImpl, MenuServiceImpl, PermServiceImpl, RoleServiceImpl, TenantServiceImpl,
    UserServiceImpl,
};
use infra_system::{AuditLogServiceImpl, SysModule, SystemLogServiceImpl};
use infra_web::OperationLogServiceImpl;

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
    let redis_pool: Arc<RedisPool> = RedisInit::init(cfg.redis.clone()).await;

    // module middleware config
    let middleware_config = Arc::new(MiddlewareConfig {
        token_store: token_store::redis_store(redis_pool.clone(), &cfg.server.prefix),
        ignore_urls: cfg.ignore_urls.clone(),
        pms_ignore_urls: cfg.pms_ignore_urls.clone(),
        auth_basics: cfg.auth_basics.clone(),
        prefix: cfg.server.prefix.to_string(),
    });
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
    let sms_config = SmsInit::init(cfg.clone());
    let system_log_service = Arc::new(SystemLogServiceImpl::new(base_pool.clone()));
    let audit_log_service = Arc::new(AuditLogServiceImpl::new(base_pool.clone()));
    let operation_log_service = Arc::new(OperationLogServiceImpl::new(base_pool.clone()));

    // build base http state
    let base_http_state = BaseHttpState {
        redis_pool: redis_pool.clone(),
        user_service: Arc::new(UserServiceImpl::new(base_pool.clone())),
        dict_service: Arc::new(DictServiceImpl::new(base_pool.clone())),
        tenant_service: Arc::new(TenantServiceImpl::new(base_pool.clone())),
        menu_service: Arc::new(MenuServiceImpl::new(base_pool.clone())),
        role_service: Arc::new(RoleServiceImpl::new(base_pool.clone())),
        perm_service: Arc::new(PermServiceImpl::new(base_pool.clone())),
        system_log_service: system_log_service.clone(),
        audit_log_service: audit_log_service.clone(),
        operation_log_service: operation_log_service.clone(),
    };

    let sys = SysModule::new(cfg.as_ref().clone(), redis_pool.as_ref().clone());
    let sys_http_state = SysHttpState {
        cfg: cfg.clone(),
        redis_pool: redis_pool.clone(),
        aws_sts_service: sys.aws_sts_service.clone(),
        object_storage_service: sys.object_storage_service.clone(),
        sms_config,
        system_log_service,
        audit_log_service,
    };

    let router = Router::new()
        .route("/ping", get(ping))
        .nest(
            "/sys",
            system_router(sys_http_state, middleware_config.clone()),
        )
        .nest(
            "/base",
            base_router(base_http_state, middleware_config.clone()),
        )
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
