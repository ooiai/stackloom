use common::core::constants::{CACHE_SIGIN_CODE, get_mobile_regex};
use neocrates::{
    axum::{Json, extract::State},
    captcha::CaptchaService,
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    sms::sms_service::SmsService,
    tracing,
};
use validator::Validate;

use crate::system::{
    SysHttpState,
    sms::{req::SmsCaptchaReq, resp::SmsCaptchaResp},
};

/// Send sign-in captcha (SMS verification code).
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<SmsCaptchaResp>>` - The response containing the captcha information.
pub async fn send_signin_captcha(
    State(state): State<SysHttpState>,
    DetailedJson(req): DetailedJson<SmsCaptchaReq>,
) -> AppResult<Json<SmsCaptchaResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「send_signin_captcha」 req: {:?}", req);
    let prefix = &state.cfg.server.prefix;

    CaptchaService::captcha_slider_valid(
        &state.redis_pool,
        prefix,
        req.code.as_str(),
        req.mobile.as_str(),
        false,
    )
    .await?;

    SmsService::send_captcha(
        &state.sms_config,
        &state.redis_pool,
        req.mobile.as_str(),
        format!("{}{}", prefix, CACHE_SIGIN_CODE).as_str(),
        get_mobile_regex(),
    )
    .await?;

    Ok(Json(SmsCaptchaResp::new()))
}
