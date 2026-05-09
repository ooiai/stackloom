pub mod handlers;
pub mod req;
pub mod resp;

use neocrates::axum::{Router, routing::post};

use super::WebHttpState;

pub fn router(state: WebHttpState) -> Router {
    Router::new()
        .route("/page", post(handlers::page))
        .route("/update-status", post(handlers::update_status))
        .route("/invite-code", post(handlers::invite_code))
        .with_state(state)
}
