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

pub type SigninState = AuthHttpState;

pub async fn query_org_units(
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

pub async fn account(
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

pub async fn logout(
    State(state): State<SigninState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<()>> {
    tracing::info!("logout auth user uid: {}", auth_user.uid);
    state.auth_service.logout(auth_user.uid).await?;
    Ok(Json(()))
}
