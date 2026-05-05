pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{SignupState, account_signup};
pub use req::AccountSignupReq;
pub use resp::AccountSignupResp;

use neocrates::axum::{Router, routing::post};

/// Build the `/auth/signup` sub-router.
///
/// Self-service signup currently exposes a single endpoint that creates
/// the account, tenant, default role, and initial membership together.
pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/account", post(account_signup))
        .with_state(state)
}
