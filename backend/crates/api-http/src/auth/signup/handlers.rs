use super::{req::AccountSignupReq, resp::AccountSignupResp};
use crate::auth::AuthHttpState;
use domain_auth::AccountSignupCmd;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

/// Shared state used by the signup HTTP handlers.
pub type SignupState = AuthHttpState;

/// Create a new account, tenant, and initial membership for self-service signup.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The signup request with account, password, captcha, nickname, and tenant name.
///
/// # Returns
/// * `AppResult<Json<AccountSignupResp>>` - The created account and tenant summary.
pub async fn account_signup(
    State(state): State<SignupState>,
    DetailedJson(req): DetailedJson<AccountSignupReq>,
) -> AppResult<Json<AccountSignupResp>> {
    tracing::info!("signup account req: {:?}", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: AccountSignupCmd = req.into();
    let result = state.auth_service.account_signup(cmd).await?;

    Ok(Json(AccountSignupResp::from(result)))
}
