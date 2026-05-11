use std::sync::Arc;

use common::config::env_config::EnvConfig;
use domain_base::{NotificationService, TenantService, UserTenantService};
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
    rediscache::RedisPool,
};

pub mod join;
pub mod members;

#[derive(Clone)]
pub struct WebHttpState {
    pub user_tenant_service: Arc<dyn UserTenantService>,
    pub tenant_service: Arc<dyn TenantService>,
    pub redis_pool: Arc<RedisPool>,
    pub cfg: Arc<EnvConfig>,
    pub notification_service: Arc<dyn NotificationService>,
}

pub fn router(state: WebHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let members_router = members::router(state.clone());

    // The validate-invite route is public (listed in config.yml ignore_urls).
    // The join route requires authentication via the interceptor middleware.
    let join_router = join::router(state.clone());

    Router::new()
        .with_state(state.clone())
        .nest("/members", members_router)
        .nest("/join", join_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
