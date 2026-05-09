use neocrates::{helper::core::serde_helpers, serde::Serialize};

/// Public tenant info returned when validating an invite code.
#[derive(Debug, Clone, Serialize)]
pub struct ValidateInviteResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub tenant_name: String,
    pub tenant_slug: String,
}
