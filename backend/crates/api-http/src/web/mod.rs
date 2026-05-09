use std::sync::Arc;

use domain_base::UserTenantService;
use neocrates::{
    axum::{Router, middleware},
    middlewares::{interceptor::interceptor, models::MiddlewareConfig},
};

pub mod members;

#[derive(Clone)]
pub struct WebHttpState {
    pub user_tenant_service: Arc<dyn UserTenantService>,
}

pub fn router(state: WebHttpState, mw: Arc<MiddlewareConfig>) -> Router {
    let members_router = members::router(state.clone());

    Router::new()
        .with_state(state.clone())
        .nest("/members", members_router)
        .layer(middleware::from_fn_with_state(mw, interceptor))
}
