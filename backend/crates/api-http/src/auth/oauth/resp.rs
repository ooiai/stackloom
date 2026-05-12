use domain_auth::oauth::OAuthToken;
use neocrates::{chrono::Utc, serde::Serialize};

/// Response returned after a successful authorization code issuance.
#[derive(Debug, Clone, Serialize)]
pub struct AuthorizeResp {
    pub code: String,
    pub state: String,
}

/// Standard OAuth2 token response.
#[derive(Debug, Clone, Serialize)]
pub struct OAuthTokenResp {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    /// Remaining lifetime of the access token in seconds.
    pub expires_in: i64,
    pub scopes: Vec<String>,
}

impl From<OAuthToken> for OAuthTokenResp {
    fn from(token: OAuthToken) -> Self {
        let now = Utc::now().timestamp();
        Self {
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: (token.access_token_expires_at - now).max(0),
            scopes: token.scopes,
        }
    }
}

/// Response from the provider login endpoint — contains the URL to navigate the
/// browser to for third-party authentication.
#[derive(Debug, Clone, Serialize)]
pub struct ProviderLoginResp {
    pub redirect_url: String,
}
