use super::{req::SignupAccountReq, resp::SignupAccountResp};
use crate::auth::AuthHttpState;
use domain_auth::SignupCmd;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type SignupState = AuthHttpState;

pub async fn account(
    State(state): State<SignupState>,
    DetailedJson(req): DetailedJson<SignupAccountReq>,
) -> AppResult<Json<SignupAccountResp>> {
    tracing::info!("signup account req: {:?}", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: SignupCmd = req.into();
    let result = state.auth_service.signup(cmd).await?;

    Ok(Json(SignupAccountResp::from(result)))
}
