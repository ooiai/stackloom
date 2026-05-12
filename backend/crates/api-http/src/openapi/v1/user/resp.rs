use neocrates::{helper::core::serde_helpers, serde::Serialize};

/// User profile returned by the public OpenAPI v1 endpoint.
#[derive(Debug, Clone, Serialize)]
pub struct OpenApiUserProfileResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub user_id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub scopes: Vec<String>,
}
