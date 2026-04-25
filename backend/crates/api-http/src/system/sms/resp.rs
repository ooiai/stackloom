use neocrates::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SmsCaptchaResp {
    pub success: bool,
}

impl SmsCaptchaResp {
    pub fn new() -> Self {
        Self { success: true }
    }
}
