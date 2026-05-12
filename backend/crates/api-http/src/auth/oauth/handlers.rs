use super::{
    req::{AuthorizeReq, ProviderExchangeReq, ProviderLoginReq, RevokeReq, TokenReq},
    resp::{AuthorizeResp, OAuthTokenResp, ProviderLoginResp},
};
use crate::auth::{signin::resp::AuthTokenResp, AuthHttpState};
use domain_auth::oauth::{AuthorizeCmd, ExchangeCodeCmd, RefreshOAuthTokenCmd, RevokeOAuthTokenCmd};
use neocrates::{
    axum::{
        Extension, Json,
        extract::{Path, State},
    },
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type OAuthState = AuthHttpState;

/// Issue an authorization code for the currently-authenticated user.
pub async fn authorize(
    State(state): State<OAuthState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<AuthorizeReq>,
) -> AppResult<Json<AuthorizeResp>> {
    tracing::info!("oauth authorize req client_id: {}", req.client_id);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = AuthorizeCmd {
        client_id: req.client_id,
        redirect_uri: req.redirect_uri,
        scopes: req.scopes,
        state: req.state,
        code_challenge: req.code_challenge,
        code_challenge_method: req.code_challenge_method,
        user_id: auth_user.uid,
        tenant_id: auth_user.tid,
    };

    let result = state.oauth_service.authorize(cmd).await?;
    Ok(Json(AuthorizeResp {
        code: result.code,
        state: result.state,
    }))
}

/// Exchange a code or refresh token for an OAuth2 token pair.
pub async fn token(
    State(state): State<OAuthState>,
    DetailedJson(req): DetailedJson<TokenReq>,
) -> AppResult<Json<OAuthTokenResp>> {
    tracing::info!("oauth token req grant_type: {}", req.grant_type);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let oauth_token = match req.grant_type.as_str() {
        "authorization_code" => {
            let cmd = ExchangeCodeCmd {
                code: req.code.ok_or_else(|| {
                    AppError::ValidationError(
                        "code is required for authorization_code grant".to_string(),
                    )
                })?,
                code_verifier: req.code_verifier.ok_or_else(|| {
                    AppError::ValidationError("code_verifier is required".to_string())
                })?,
                redirect_uri: req.redirect_uri.unwrap_or_default(),
                client_id: req.client_id,
                client_secret: req.client_secret,
            };
            state.oauth_service.exchange_code(cmd).await?
        }
        "refresh_token" => {
            let cmd = RefreshOAuthTokenCmd {
                refresh_token: req.refresh_token.ok_or_else(|| {
                    AppError::ValidationError("refresh_token is required".to_string())
                })?,
                client_id: req.client_id,
                client_secret: req.client_secret,
            };
            state.oauth_service.refresh_token(cmd).await?
        }
        other => {
            return Err(AppError::ValidationError(format!(
                "unsupported grant_type: {}",
                other
            )));
        }
    };

    Ok(Json(OAuthTokenResp::from(oauth_token)))
}

/// Revoke an access or refresh token (RFC 7009 — always returns 200).
pub async fn revoke(
    State(state): State<OAuthState>,
    DetailedJson(req): DetailedJson<RevokeReq>,
) -> AppResult<Json<()>> {
    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = RevokeOAuthTokenCmd {
        token: req.token,
        client_id: req.client_id,
        client_secret: req.client_secret,
    };
    state.oauth_service.revoke_token(cmd).await?;
    Ok(Json(()))
}

/// Return the provider's authorization URL for the browser to navigate to.
///
/// Generates a CSRF state token, stores it in Redis, and returns a JSON
/// `{redirect_url}` pointing to the third-party provider's login page.
pub async fn provider_login_handler(
    State(state): State<OAuthState>,
    Path(provider): Path<String>,
    DetailedJson(req): DetailedJson<ProviderLoginReq>,
) -> AppResult<Json<ProviderLoginResp>> {
    tracing::info!("oauth provider login: provider={}", provider);

    let (redirect_url, _state_token) = state
        .oauth_service
        .provider_login_url(&provider, req.redirect_after)
        .await?;

    Ok(Json(ProviderLoginResp { redirect_url }))
}

/// Exchange the authorization code returned by a third-party provider for a
/// system session token.
///
/// The frontend callback page collects `code` and `state` from its URL query
/// string and POSTs them here to receive an `AuthTokenResp`.
pub async fn provider_exchange_handler(
    State(state): State<OAuthState>,
    DetailedJson(req): DetailedJson<ProviderExchangeReq>,
) -> AppResult<Json<AuthTokenResp>> {
    tracing::info!("oauth provider exchange: provider={}", req.provider);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let (info, _redirect_after) = state
        .oauth_service
        .exchange_provider_code(&req.provider, &req.code, &req.state)
        .await?;

    let token = state.auth_service.provider_login_or_signup(info).await?;
    Ok(Json(AuthTokenResp::from(token)))
}
