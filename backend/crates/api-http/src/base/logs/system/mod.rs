pub mod handlers;
pub mod req;
pub mod resp;

use crate::base::BaseHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/page", post(handlers::page))
        .with_state(state)
}
