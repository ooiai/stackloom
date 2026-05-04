pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{SigninState, account, logout, query_org_units, refresh_token};
pub use req::{AccountSigninReq, QuerySigninTenantsReq, RefreshTokenReq};
pub use resp::{AuthTokenResp, SigninTenantOptionResp};

use neocrates::axum::{Router, routing::post};

pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/org_units", post(query_org_units))
        .route("/account", post(account))
        .route("/refresh_token", post(refresh_token))
        .route("/logout", post(logout))
        .with_state(state)
}
