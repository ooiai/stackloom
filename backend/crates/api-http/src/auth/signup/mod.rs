pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{SignupState, account_signup, invite_signup, send_signup_code};
pub use req::{AccountSignupReq, InviteSignupReq, SendSignupCodeReq};
pub use resp::AccountSignupResp;

use neocrates::axum::{Router, routing::post};

/// Build the `/auth/signup` sub-router.
///
/// Self-service signup creates a tenant, while invite signup creates an account
/// inside an existing tenant resolved from an invite code.
pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/send_code", post(send_signup_code))
        .route("/account", post(account_signup))
        .route("/invite", post(invite_signup))
        .with_state(state)
}
