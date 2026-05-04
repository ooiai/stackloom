use std::sync::Arc;

use domain_auth::AuthService;
use domain_system::SystemLogService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
};

pub mod signin;
pub mod signup;

#[derive(Clone)]
pub struct AuthHttpState {
    pub auth_service: Arc<dyn AuthService>,
    pub system_log_service: Arc<dyn SystemLogService>,
}

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
