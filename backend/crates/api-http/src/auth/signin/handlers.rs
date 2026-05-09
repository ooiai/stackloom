use super::{
    req::{
        AccountSigninReq, QuerySigninTenantsReq, RefreshTokenReq, ResetPasswordReq,
        SendPasswordResetCodeReq,
    },
    resp::{AuthTokenResp, SigninTenantOptionResp},
};
use crate::auth::AuthHttpState;
use domain_auth::{
    AccountSigninCmd, QuerySigninTenantsCmd, RefreshAuthCmd, ResetPasswordCmd,
    SendPasswordResetCodeCmd,
};
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
/// * `AppResult<Json<Vec<SigninTenantOptionResp>>>` - The list of selectable tenant memberships.
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
/// * `AppResult<Json<AuthTokenResp>>` - The auth token payload for the selected membership.
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
/// * `AppResult<Json<AuthTokenResp>>` - The refreshed auth token payload.
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
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn logout(
    State(state): State<SigninState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<()>> {
    tracing::info!("logout auth user uid: {}", auth_user.uid);
    state.auth_service.logout(auth_user.uid).await?;
    Ok(Json(()))
}

/// Send a password reset captcha code to phone/email.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The request with account and captcha payload.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn send_password_reset_code(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<SendPasswordResetCodeReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let cmd: SendPasswordResetCodeCmd = req.try_into()?;
    state.auth_service.send_password_reset_code(cmd).await?;
    Ok(Json(()))
}

/// Reset password after captcha verification.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The request with account, new password, captcha, and captcha key payload.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn reset_password(
    State(state): State<SigninState>,
    DetailedJson(req): DetailedJson<ResetPasswordReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let cmd: ResetPasswordCmd = req.try_into()?;
    state.auth_service.reset_password(cmd).await?;
    Ok(Json(()))
}
