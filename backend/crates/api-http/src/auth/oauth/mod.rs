pub mod handlers;
pub mod req;
pub mod resp;

use crate::auth::AuthHttpState;
use neocrates::axum::{Router, routing::{get, post}};

pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/authorize", post(handlers::authorize))
        .route("/token", post(handlers::token))
        .route("/revoke", post(handlers::revoke))
        .route("/providers/:provider/login", get(handlers::provider_login_handler))
        .route("/providers/:provider/callback", get(handlers::provider_callback_handler))
        .with_state(state)
}
