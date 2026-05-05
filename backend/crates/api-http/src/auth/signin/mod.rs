pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{SigninState, account_signin, logout, query_tenants, refresh_token};
pub use req::{AccountSigninReq, QuerySigninTenantsReq, RefreshTokenReq};
pub use resp::{AuthTokenResp, SigninTenantOptionResp};

use neocrates::axum::{Router, routing::post};

/// Build the `/auth/signin` sub-router.
///
/// The signin flow is split into multiple endpoints:
/// 1. query candidate tenant memberships;
/// 2. complete signin with the selected membership;
/// 3. refresh issued tokens;
/// 4. logout the current authenticated user.
pub fn router(state: AuthHttpState) -> Router {
    Router::new()
        .route("/tenants", post(query_tenants))
        .route("/account", post(account_signin))
        .route("/refresh_token", post(refresh_token))
        .route("/logout", post(logout))
        .with_state(state)
}
