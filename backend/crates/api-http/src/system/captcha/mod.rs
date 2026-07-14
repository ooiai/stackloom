use neocrates::axum::{Router, routing::{get, post}};

use crate::system::SysHttpState;

pub mod handlers;
pub mod req;
pub mod resp;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
            .route("/slider", post(handlers::captcha_slider))
            .route("/slider/config", get(handlers::slider_config))
        .with_state(state)
}
