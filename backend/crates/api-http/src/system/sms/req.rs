use validator::Validate;

#[derive(Debug, serde::Deserialize, Validate)]
pub struct SmsCaptchaReq {
    #[validate(length(min = 11, max = 11))]
    pub mobile: String,
    #[validate(length(min = 6))]
    pub code: String,
}
