use neocrates::axum::{Router, routing::post};

use crate::web::WebHttpState;

pub mod handlers;
pub mod req;
pub mod resp;

pub fn router(state: WebHttpState) -> Router {
    Router::new()
        .route("/validate", post(handlers::validate_invite))
        .route("/", post(handlers::join))
        .with_state(state)
}
