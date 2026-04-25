use neocrates::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SliderCaptchaResp {
    pub success: bool,
}

impl SliderCaptchaResp {
    pub fn new() -> Self {
        Self { success: true }
    }
}
