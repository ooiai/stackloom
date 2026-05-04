pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{SignupState, account};
pub use req::SignupAccountReq;
pub use resp::SignupAccountResp;

use neocrates::axum::{Router, routing::post};

pub fn router(state: AuthHttpState) -> Router {
    Router::new().route("/account", post(account)).with_state(state)
}
