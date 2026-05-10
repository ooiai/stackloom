pub mod handlers;
pub mod req;
pub mod resp;

use super::AuthHttpState;
pub use handlers::{
    SigninState, account_signin, change_password, logout, query_tenants, refresh_token,
    reset_password, send_password_reset_code,
};
pub use req::{
    AccountSigninReq, ChangePasswordReq, QuerySigninTenantsReq, RefreshTokenReq, ResetPasswordReq,
    SendPasswordResetCodeReq,
};
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
        .route("/change_password", post(change_password))
        .route("/recover/send_code", post(send_password_reset_code))
        .route("/recover/reset", post(reset_password))
        .with_state(state)
}
