use common::config::env_config::EnvConfig;
use domain_system::aws::{AwsStsService, ObjectStorageService};
use domain_system::{AuditLogService, MonitorService, SystemLogService};
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
    sms::sms_service::SmsConfig,
};
use std::sync::Arc;

pub mod aws;
pub mod captcha;
pub mod logs;
pub mod monitor;
pub mod sms;

#[derive(Clone)]
pub struct SysHttpState {
    pub aws_sts_service: Arc<dyn AwsStsService>,
    pub object_storage_service: Arc<dyn ObjectStorageService>,
    pub redis_pool: Arc<RedisPool>,
    pub cfg: Arc<EnvConfig>,
    pub sms_config: Arc<SmsConfig>,
    pub system_log_service: Arc<dyn SystemLogService>,
    pub audit_log_service: Arc<dyn AuditLogService>,
    pub monitor_service: Arc<dyn MonitorService>,
}

pub fn router(state: SysHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let aws_router = aws::router(state.clone());
    let captcha_router = captcha::router(state.clone());
    let sms_router = sms::router(state.clone());
    let logs_router = logs::router(state.clone());
    let monitor_router = monitor::router(state.clone());

    Router::new()
        .with_state(state.clone())
        .nest("/aws", aws_router)
        .nest("/captcha", captcha_router)
        .nest("/sms", sms_router)
        .nest("/logs", logs_router)
        .nest("/monitor", monitor_router)
        .layer(middleware::from_fn_with_state(
            state,
            crate::request_logging::sys_request_trace_middleware,
        ))
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
