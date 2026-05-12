pub mod handlers;
pub mod req;
pub mod resp;

use crate::openapi::OpenApiHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: OpenApiHttpState) -> Router {
    Router::new()
        .route("/me", post(handlers::me))
        .with_state(state)
}
