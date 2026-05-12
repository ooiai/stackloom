pub mod handlers;
pub mod req;
pub mod resp;

use crate::auth::AuthHttpState;
use neocrates::axum::{Router, routing::post};

pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/authorize", post(handlers::authorize))
        .route("/token", post(handlers::token))
        .route("/revoke", post(handlers::revoke))
        .route("/providers/{provider}/login", post(handlers::provider_login_handler))
        .route("/providers/exchange", post(handlers::provider_exchange_handler))
        .with_state(state)
}
