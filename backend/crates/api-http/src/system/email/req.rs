use validator::Validate;

#[derive(Debug, serde::Deserialize, Validate)]
pub struct EmailCaptchaReq {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub code: String,
}
