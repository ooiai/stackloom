use neocrates::axum::{Router, routing::post};

use crate::system::SysHttpState;

pub mod handlers;
pub mod req;
pub mod resp;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/captcha", post(handlers::send_email_captcha))
        .with_state(state)
}
