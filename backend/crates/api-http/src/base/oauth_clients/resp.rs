use domain_auth::oauth::OAuthClient;
use neocrates::{helper::core::serde_helpers, serde::Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct OAuthClientResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
    pub name: String,
    pub client_id: String,
    pub redirect_uris: Vec<String>,
    pub allowed_scopes: Vec<String>,
    pub status: i16,
    pub description: Option<String>,
}

impl From<OAuthClient> for OAuthClientResp {
    fn from(c: OAuthClient) -> Self {
        Self {
            id: c.id,
            tenant_id: c.tenant_id,
            name: c.name,
            client_id: c.client_id,
            redirect_uris: c.redirect_uris,
            allowed_scopes: c.allowed_scopes,
            status: c.status,
            description: c.description,
        }
    }
}

/// Returned once on client creation — includes the plaintext secret (shown only once).
#[derive(Debug, Clone, Serialize)]
pub struct OAuthClientCreatedResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateOAuthClientResp {
    pub items: Vec<OAuthClientResp>,
    pub total: i64,
}

/// Returned once after rotating the client secret — includes the new plaintext secret.
#[derive(Debug, Clone, Serialize)]
pub struct RotateSecretResp {
    pub client_secret: String,
}
