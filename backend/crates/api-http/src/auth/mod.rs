use common::config::env_config::EnvConfig;
use std::sync::Arc;

use domain_auth::AuthService;
use domain_base::NotificationService;
use domain_system::SystemLogService;
use neocrates::{
    axum::{Router, middleware},
    email::email_service::EmailConfig,
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
    sms::sms_service::SmsConfig,
};

pub mod signin;
pub mod signup;

/// Shared HTTP state for auth endpoints.
///
/// The auth module currently depends on the auth domain service for signin and
/// signup behavior, and on the system log service for request/mutation logging
/// performed by surrounding middleware or handlers.
#[derive(Clone)]
pub struct AuthHttpState {
    pub auth_service: Arc<dyn AuthService>,
    pub notification_service: Arc<dyn NotificationService>,
    pub system_log_service: Arc<dyn SystemLogService>,
    pub sms_config: Arc<SmsConfig>,
    pub email_config: Arc<EmailConfig>,
    pub redis_pool: Arc<RedisPool>,
    pub cfg: Arc<EnvConfig>,
}

/// Build the `/auth` router and attach common auth middleware.
///
/// The router nests the signin and signup submodules, then applies:
/// 1. request trace logging specialized for auth requests;
/// 2. the common request interceptor middleware.
pub fn router(state: AuthHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let signin_router = signin::router(state.clone());
    let signup_router = signup::router(state.clone());

    Router::new()
        .with_state(state.clone())
        .nest("/signin", signin_router)
        .nest("/signup", signup_router)
        .layer(middleware::from_fn_with_state(
            state,
            crate::request_logging::auth_request_trace_middleware,
        ))
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
