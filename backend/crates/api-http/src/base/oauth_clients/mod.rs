pub mod handlers;
pub mod req;
pub mod resp;

use crate::base::BaseHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(handlers::create))
        .route("/get", post(handlers::get))
        .route("/page", post(handlers::page))
        .route("/update", post(handlers::update))
        .route("/remove", post(handlers::delete))
        .route("/rotate_secret", post(handlers::rotate_secret))
        .with_state(state)
}
