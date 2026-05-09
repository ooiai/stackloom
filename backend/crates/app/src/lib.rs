use api_http::{
    AuthHttpState, BaseHttpState, SharedHttpState, SysHttpState, WebHttpState, auth_router,
    base_router, shared_router, system_router, web_router,
};
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
    email_init::EmailInit, redis_init::RedisInit, sms_init::SmsInit, sqlx_init::SqlxInit,
    sqlx_migrations::SqlxMigrations,
};
use infra_auth::AuthServiceImpl;
use infra_base::{
    DictServiceImpl, MenuServiceImpl, PermServiceImpl, RoleServiceImpl, SharedContextServiceImpl,
    TenantServiceImpl, UserServiceImpl, UserTenantRoleServiceImpl, UserTenantServiceImpl,
};
use infra_system::{AuditLogServiceImpl, MonitorServiceImpl, SysModule, SystemLogServiceImpl};
use infra_web::OperationLogServiceImpl;

mod diesel_init;
mod diesel_migrations;
mod email_init;
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
    // record server start time for uptime tracking
    let start_time = Arc::new(std::time::Instant::now());

    // module middleware config
    let middleware_config = Arc::new(MiddlewareConfig {
        token_store: token_store::redis_store(redis_pool.clone(), &cfg.server.prefix),
        ignore_urls: cfg.ignore_urls.clone(),
        pms_ignore_urls: cfg.pms_ignore_urls.clone(),
        auth_basics: cfg.auth_basics.clone(),
        prefix: cfg.server.prefix.to_string(),
        enable_auth: cfg.auth.enabled,
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
    // Email Config initialization
    let email_config = EmailInit::init(cfg.clone());
    let system_log_service = Arc::new(SystemLogServiceImpl::new(base_pool.clone()));
    let audit_log_service = Arc::new(AuditLogServiceImpl::new(base_pool.clone()));
    let operation_log_service = Arc::new(OperationLogServiceImpl::new(base_pool.clone()));
    let user_service = Arc::new(UserServiceImpl::new(base_pool.clone()));
    let dict_service = Arc::new(DictServiceImpl::new(base_pool.clone()));
    let tenant_service = Arc::new(TenantServiceImpl::new(base_pool.clone()));
    let menu_service = Arc::new(MenuServiceImpl::new(
        base_pool.clone(),
        redis_pool.clone(),
        cfg.server.prefix.clone(),
    ));
    let role_service = Arc::new(RoleServiceImpl::new(
        base_pool.clone(),
        redis_pool.clone(),
        cfg.server.prefix.clone(),
    ));
    let perm_service = Arc::new(PermServiceImpl::new(base_pool.clone()));
    let user_tenant_service = Arc::new(UserTenantServiceImpl::new(base_pool.clone()));
    let user_tenant_role_service = Arc::new(UserTenantRoleServiceImpl::new(base_pool.clone()));
    let shared_context_service = Arc::new(SharedContextServiceImpl::new(
        base_pool.clone(),
        user_service.clone(),
        tenant_service.clone(),
        user_tenant_service.clone(),
        user_tenant_role_service.clone(),
        role_service.clone(),
        redis_pool.clone(),
        cfg.server.prefix.clone(),
    ));
    let auth_service = Arc::new(AuthServiceImpl::new(
        base_pool.clone(),
        redis_pool.clone(),
        sms_config.clone(),
        email_config.clone(),
        cfg.server.prefix.clone(),
        cfg.auth.expires_at,
        cfg.auth.refresh_expires_at,
    ));

    // build base http state
    let web_http_state = WebHttpState {
        user_tenant_service: user_tenant_service.clone(),
        tenant_service: tenant_service.clone(),
        redis_pool: redis_pool.clone(),
        cfg: cfg.clone(),
    };
    let base_http_state = BaseHttpState {
        cfg: cfg.clone(),
        redis_pool: redis_pool.clone(),
        user_service: user_service.clone(),
        dict_service: dict_service,
        tenant_service: tenant_service.clone(),
        menu_service: menu_service.clone(),
        role_service: role_service.clone(),
        perm_service,
        user_tenant_service: user_tenant_service.clone(),
        user_tenant_role_service: user_tenant_role_service.clone(),
        shared_context_service: shared_context_service.clone(),
        system_log_service: system_log_service.clone(),
        audit_log_service: audit_log_service.clone(),
        operation_log_service: operation_log_service.clone(),
    };
    let shared_http_state = SharedHttpState {
        menu_service,
        shared_context_service,
        tenant_service,
    };
    let auth_http_state = AuthHttpState {
        auth_service,
        system_log_service: system_log_service.clone(),
        sms_config: sms_config.clone(),
        email_config,
        redis_pool: redis_pool.clone(),
        cfg: cfg.clone(),
    };

    let sys = SysModule::new(cfg.as_ref().clone(), redis_pool.as_ref().clone());
    let monitor_service = Arc::new(MonitorServiceImpl::new(base_pool.clone(), redis_pool.clone(), start_time));
    let sys_http_state = SysHttpState {
        cfg: cfg.clone(),
        redis_pool: redis_pool.clone(),
        aws_sts_service: sys.aws_sts_service.clone(),
        object_storage_service: sys.object_storage_service.clone(),
        sms_config,
        email_config: EmailInit::init(cfg.clone()),
        system_log_service,
        audit_log_service,
        monitor_service,
    };

    let router = Router::new()
        .route("/ping", get(ping))
        .nest(
            "/auth",
            auth_router(auth_http_state, middleware_config.clone()),
        )
        .nest(
            "/sys",
            system_router(sys_http_state, middleware_config.clone()),
        )
        .nest(
            "/base",
            base_router(base_http_state, middleware_config.clone()),
        )
        .nest(
            "/shared",
            shared_router(shared_http_state, middleware_config.clone()),
        )
        .nest(
            "/web",
            web_router(web_http_state, middleware_config.clone()),
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
