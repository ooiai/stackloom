use neocrates::axum::{Router, routing::post};

use crate::system::SysHttpState;

pub mod handlers;
pub mod req;
pub mod resp;

pub fn router(state: SysHttpState) -> Router {
    Router::new()
        .route("/sts", post(handlers::cos_sts))
        .route("/sign_url", post(handlers::sign_url))
        .route("/upload_remote_image", post(handlers::upload_remote_image))
        .route(
            "/upload_remote_object",
            post(handlers::upload_remote_object),
        )
        .with_state(state)
}
