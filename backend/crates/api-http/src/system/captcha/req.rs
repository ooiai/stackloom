use validator::Validate;

#[derive(Debug, serde::Deserialize, Validate)]
pub struct SliderCaptchaReq {
    #[validate(length(min = 1))]
    pub code: String,
    #[validate(length(min = 6, max = 512))]
    pub account: String,
}
