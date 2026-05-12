use domain_auth::oauth::{CreateOAuthClientCmd, UpdateOAuthClientCmd};
use neocrates::{helper::core::serde_helpers, serde::Deserialize};
use validator::Validate;

/// Request to create a new OAuth2 client application.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateOAuthClientReq {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(min = 1))]
    pub client_secret: String,
    pub redirect_uris: Vec<String>,
    pub allowed_scopes: Vec<String>,
    pub description: Option<String>,
}

impl CreateOAuthClientReq {
    /// Convert the HTTP request into the domain command, injecting the caller's tenant.
    pub fn into_cmd(self, tenant_id: i64) -> CreateOAuthClientCmd {
        CreateOAuthClientCmd {
            tenant_id,
            name: self.name,
            client_secret: self.client_secret,
            // Service fills these in:
            client_id: String::new(),
            client_secret_hash: String::new(),
            redirect_uris: self.redirect_uris,
            allowed_scopes: self.allowed_scopes,
            description: self.description,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct GetOAuthClientReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageOAuthClientReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,
    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,
    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,
    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct UpdateOAuthClientReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
    pub name: Option<String>,
    pub redirect_uris: Option<Vec<String>>,
    pub allowed_scopes: Option<Vec<String>>,
    pub status: Option<i16>,
    pub description: Option<String>,
}

impl From<UpdateOAuthClientReq> for UpdateOAuthClientCmd {
    fn from(req: UpdateOAuthClientReq) -> Self {
        Self {
            id: req.id,
            name: req.name,
            redirect_uris: req.redirect_uris,
            allowed_scopes: req.allowed_scopes,
            status: req.status,
            description: req.description,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct DeleteOAuthClientReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RotateOAuthClientSecretReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}
