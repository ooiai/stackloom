use std::sync::Arc;

use domain_base::{
    MenuService, SharedContextService, TenantService,
};
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
};

pub mod common;
pub mod profile;

/// The shared HTTP state for cross-cutting endpoints such as profile.
#[derive(Clone)]
pub struct SharedHttpState {
    pub menu_service: Arc<dyn MenuService>,
    pub shared_context_service: Arc<dyn SharedContextService>,
    pub tenant_service: Arc<dyn TenantService>,
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
    let profile_router = profile::router(state);
    Router::new()
        .nest("/common", common_router)
        .nest("/profile", profile_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
