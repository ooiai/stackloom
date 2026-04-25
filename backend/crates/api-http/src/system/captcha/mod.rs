use neocrates::axum::{Router, routing::post};

use crate::system::SysHttpState;

pub mod req;
pub mod resp;
pub mod handlers;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/slider", post(handlers::captcha_slider))
        .with_state(state)
}
