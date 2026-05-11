pub mod handlers;
pub mod req;
pub mod resp;

use super::BaseHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/get", post(handlers::get))
        .route("/page", post(handlers::page))
        .route("/sign", post(handlers::sign))
        .with_state(state)
}
