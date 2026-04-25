use neocrates::axum::{Router, routing::post};

use crate::system::SysHttpState;

pub mod req;
pub mod resp;
pub mod handlers;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/signin", post(handlers::send_signin_captcha))
        .with_state(state)
}
