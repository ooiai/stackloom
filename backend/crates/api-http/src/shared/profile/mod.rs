pub mod handlers;
pub mod resp;

use super::SharedHttpState;
use neocrates::axum::{Router, routing::post};

/// Router for `/profile` endpoints.
pub fn router(state: SharedHttpState) -> Router {
    Router::new()
        .route("/get", post(handlers::get))
        .with_state(state)
}
