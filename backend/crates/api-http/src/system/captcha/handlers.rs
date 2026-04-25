use neocrates::{
    axum::{Json, extract::State},
    captcha::CaptchaService,
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

use crate::system::{
    SysHttpState,
    captcha::{req::SliderCaptchaReq, resp::SliderCaptchaResp},
};

pub async fn captcha_slider(
    State(state): State<SysHttpState>,
    DetailedJson(req): DetailedJson<SliderCaptchaReq>,
) -> AppResult<Json<SliderCaptchaResp>> {
    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    tracing::info!("「captcha_slider」 req: {:?}", req);
    let prefix = &state.cfg.server.prefix;
    CaptchaService::gen_captcha_slider(
        &state.redis_pool,
        prefix,
        &req.code,
        &req.account,
        Some(300),
    )
    .await
    .map_err(|err| AppError::ClientError(err.to_string()))?;
    Ok(Json(SliderCaptchaResp::new()))
}
