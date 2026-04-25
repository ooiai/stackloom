use common::config::env_config::EnvConfig;
use domain_system::aws::{AwsStsService, ObjectStorageService};
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
    sms::sms_service::SmsConfig,
};
use std::sync::Arc;

pub mod aws;
pub mod captcha;
pub mod sms;

#[derive(Clone)]
pub struct SysHttpState {
    pub aws_sts_service: Arc<dyn AwsStsService>,
    pub object_storage_service: Arc<dyn ObjectStorageService>,
    pub redis_pool: Arc<RedisPool>,
    pub cfg: Arc<EnvConfig>,
    pub sms_config: Arc<SmsConfig>,
}

pub fn router(state: SysHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let aws_router = aws::router(state.clone());
    let captcha_router = captcha::router(state.clone());
    let sms_router = sms::router(state.clone());

    Router::new()
        .with_state(state)
        .nest("/aws", aws_router)
        .nest("/captcha", captcha_router)
        .nest("/sms", sms_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
