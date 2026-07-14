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

#[derive(Debug, Serialize)]
pub struct SliderConfigResp {
    pub enabled: bool,
    pub provider: String,
}

impl SliderConfigResp {
    pub fn new(enabled: bool, provider: String) -> Self {
        Self { enabled, provider }
    }
}
