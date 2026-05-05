use super::{
    req::{AccountSigninReq, QuerySigninTenantsReq, RefreshTokenReq},
    resp::{AuthTokenResp, SigninTenantOptionResp},
};
use crate::auth::AuthHttpState;
use domain_auth::{AccountSigninCmd, QuerySigninTenantsCmd, RefreshAuthCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

/// Shared state used by all signin HTTP handlers.
pub type SigninState = AuthHttpState;

/// Query the tenant options available to the current account before signin.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The signin request with account, password, and captcha payload.
///
/// # Returns
/// A JSON array of tenant options for the final signin step.
pub async fn query_tenants(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<QuerySigninTenantsReq>,
) -> AppResult<Json<Vec<SigninTenantOptionResp>>> {
    tracing::info!("query signin tenants req: {:?}", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: QuerySigninTenantsCmd = req.into();
    let items = state
        .auth_service
        .query_signin_tenants(cmd)
        .await?
        .into_iter()
        .map(SigninTenantOptionResp::from)
        .collect::<Vec<_>>();

    Ok(Json(items))
}

/// Perform the final signin with the tenant membership selected in the tenant query step.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The signin request with account, password, captcha, membership, and tenant ids.
///
/// # Returns
/// A JSON auth token payload for the selected tenant membership.
pub async fn account_signin(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<AccountSigninReq>,
) -> AppResult<Json<AuthTokenResp>> {
    tracing::info!("account signin req: {:?}", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: AccountSigninCmd = req.into();
    let token = state.auth_service.account_signin(cmd).await?;

    Ok(Json(AuthTokenResp::from(token)))
}

/// Refresh the current auth token.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The refresh request with access and refresh tokens.
///
/// # Returns
/// A JSON auth token payload with refreshed credentials.
pub async fn refresh_token(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<RefreshTokenReq>,
) -> AppResult<Json<AuthTokenResp>> {
    tracing::info!("refresh signin token req: {:?}", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: RefreshAuthCmd = req.into();
    let token = state.auth_service.refresh_token(cmd).await?;

    Ok(Json(AuthTokenResp::from(token)))
}

/// Logout the current authenticated user.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The current authenticated user context.
///
/// # Returns
/// An empty JSON payload after token deletion succeeds.
pub async fn logout(
    State(state): State<SigninState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<()>> {
    tracing::info!("logout auth user uid: {}", auth_user.uid);
    state.auth_service.logout(auth_user.uid).await?;
    Ok(Json(()))
}
