pub mod handlers;
pub mod req;
pub mod resp;

use crate::system::SysHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/page", post(handlers::page))
        .with_state(state)
}
