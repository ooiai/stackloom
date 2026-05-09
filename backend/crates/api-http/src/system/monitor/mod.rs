pub mod handlers;
pub mod resp;

use crate::system::SysHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/metrics", post(handlers::metrics))
        .with_state(state)
}
