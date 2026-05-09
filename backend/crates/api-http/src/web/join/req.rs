use neocrates::serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct ValidateInviteReq {
    pub invite_code: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct JoinByInviteReq {
    pub invite_code: String,
}
