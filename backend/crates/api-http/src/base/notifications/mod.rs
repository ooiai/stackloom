pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/page", post(handlers::page_dispatches))
        .route("/send", post(handlers::send))
        .route("/templates/page", post(handlers::page_templates))
        .route("/templates/create", post(handlers::create_template))
        .route("/templates/update", post(handlers::update_template))
        .route("/rules/page", post(handlers::page_rules))
        .route("/rules/create", post(handlers::create_rule))
        .route("/rules/update", post(handlers::update_rule))
        .with_state(state)
}
