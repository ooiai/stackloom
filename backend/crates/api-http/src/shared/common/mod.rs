pub mod handlers;
pub mod req;
pub mod resp;

use super::SharedHttpState;
use neocrates::axum::{Router, routing::post};

/// Router for `/common` shared endpoints.
pub fn router(state: SharedHttpState) -> Router {
    Router::new()
        .route("/header_context", post(handlers::header_context))
        .route("/tree_by_code", post(handlers::tree_by_code))
        .route("/my_tenants", post(handlers::my_tenants))
        .with_state(state)
}
