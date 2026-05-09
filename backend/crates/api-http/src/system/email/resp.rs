use neocrates::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct EmailCaptchaResp {
    pub success: bool,
}

impl EmailCaptchaResp {
    pub fn new() -> Self {
        Self { success: true }
    }
}
