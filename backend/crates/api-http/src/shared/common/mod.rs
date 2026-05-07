pub mod handlers;
pub mod req;
pub mod resp;

use super::SharedHttpState;
use neocrates::axum::{Router, routing::post};

/// Router for `/common` shared endpoints.
pub fn router(state: SharedHttpState) -> Router {
    Router::new()
        .route("/tree_by_code", post(handlers::tree_by_code))
        .with_state(state)
}
