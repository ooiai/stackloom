use std::sync::Arc;

use ::common::config::env_config::EnvConfig;
use domain_base::{MenuService, NotificationService, SharedContextService, UserTenantService};
use domain_system::aws::ObjectStorageService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
};

pub mod common;
pub mod notifications;
pub mod profile;

/// The shared HTTP state for cross-cutting endpoints such as profile.
#[derive(Clone)]
pub struct SharedHttpState {
    pub cfg: Arc<EnvConfig>,
    pub menu_service: Arc<dyn MenuService>,
    pub shared_context_service: Arc<dyn SharedContextService>,
    pub user_tenant_service: Arc<dyn UserTenantService>,
    pub object_storage_service: Arc<dyn ObjectStorageService>,
    pub notification_service: Arc<dyn NotificationService>,
}

/// The shared router, nested under `/shared`.
///
/// # Arguments
/// * `state` - The shared HTTP state.
/// * `mw` - The middleware configuration used to apply auth interception.
///
/// # Returns
/// A `Router` instance covering shared endpoints.
pub fn router(state: SharedHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let common_router = common::router(state.clone());
    let profile_router = profile::router(state.clone());
    let notifications_router = notifications::router(state);
    Router::new()
        .nest("/common", common_router)
        .nest("/profile", profile_router)
        .nest("/notifications", notifications_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
