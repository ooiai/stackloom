use std::sync::Arc;

use domain_base::UserService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
};

pub mod profile;

/// The shared HTTP state for cross-cutting endpoints such as profile.
#[derive(Clone)]
pub struct SharedHttpState {
    pub user_service: Arc<dyn UserService>,
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
    let profile_router = profile::router(state);
    Router::new()
        .nest("/profile", profile_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
