use common::core::constants::{CACHE_PASSWORD_RESET_EMAIL_CODE, get_email_regex};
use neocrates::{
    axum::{Json, extract::State},
    captcha::CaptchaService,
    email::email_service::EmailService,
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

use crate::system::{
    SysHttpState,
    email::{req::EmailCaptchaReq, resp::EmailCaptchaResp},
};

/// Send email captcha code via the generic system email capability.
///
/// # Arguments
/// - `State(state)`: The shared state containing configuration and resources.
/// - `DetailedJson(req)`: The request payload containing the email and captcha code, validated against the `EmailCaptchaReq` struct.
///
/// # Returns
/// - `AppResult<Json<EmailCaptchaResp>>`: A JSON response indicating the success of the email captcha sending operation, or an error if validation fails or if there are issues with the captcha validation or email sending process.
pub async fn send_email_captcha(
    State(state): State<SysHttpState>,
    DetailedJson(req): DetailedJson<EmailCaptchaReq>,
) -> AppResult<Json<EmailCaptchaResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("send_email_captcha req accepted");

    let prefix = &state.cfg.server.prefix;
    CaptchaService::captcha_slider_valid(
        &state.redis_pool,
        prefix,
        req.code.as_str(),
        req.email.as_str(),
        false,
    )
    .await?;

    EmailService::send_captcha(
        &state.email_config,
        &state.redis_pool,
        req.email.as_str(),
        format!("{}{}", prefix, CACHE_PASSWORD_RESET_EMAIL_CODE).as_str(),
        get_email_regex(),
    )
    .await?;

    Ok(Json(EmailCaptchaResp::new()))
}
