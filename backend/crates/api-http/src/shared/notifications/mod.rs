pub mod handlers;
pub mod req;
pub mod resp;

use super::SharedHttpState;
use neocrates::axum::{
    Router,
    routing::{get, post},
};

pub fn router(state: SharedHttpState) -> Router {
    Router::new()
        .route("/page", post(handlers::page))
        .route("/unread_count", post(handlers::unread_count))
        .route("/mark_read", post(handlers::mark_read))
        .route("/mark_all_read", post(handlers::mark_all_read))
        .route("/archive", post(handlers::archive))
        .route("/stream", get(handlers::stream))
        .with_state(state)
}
