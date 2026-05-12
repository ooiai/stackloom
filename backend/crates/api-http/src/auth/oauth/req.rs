use neocrates::serde::Deserialize;
use validator::Validate;

/// Authorization request: issued by a logged-in user to grant an OAuth2 client access.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct AuthorizeReq {
    #[validate(length(min = 1))]
    pub client_id: String,
    #[validate(length(min = 1))]
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    pub state: String,
    #[validate(length(min = 1))]
    pub code_challenge: String,
    pub code_challenge_method: String,
}

/// Token request: supports `authorization_code` and `refresh_token` grants.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct TokenReq {
    #[validate(length(min = 1))]
    pub grant_type: String,
    /// Authorization code (authorization_code grant only).
    pub code: Option<String>,
    /// PKCE verifier (authorization_code grant only).
    pub code_verifier: Option<String>,
    /// Redirect URI (authorization_code grant only).
    pub redirect_uri: Option<String>,
    #[validate(length(min = 1))]
    pub client_id: String,
    #[validate(length(min = 1))]
    pub client_secret: String,
    /// Refresh token (refresh_token grant only).
    pub refresh_token: Option<String>,
}

/// Revoke request: RFC 7009.
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RevokeReq {
    #[validate(length(min = 1))]
    pub token: String,
    #[validate(length(min = 1))]
    pub client_id: String,
    #[validate(length(min = 1))]
    pub client_secret: String,
}

/// Query parameters for the provider login redirect endpoint.
///
/// `redirect_after` is an optional URL to redirect the user to after successful
/// authentication (with `access_token` and `refresh_token` as query params).
/// When absent the callback returns a JSON token response instead.
#[derive(Debug, Clone, Deserialize)]
pub struct ProviderLoginQuery {
    pub redirect_after: Option<String>,
}

/// Query parameters delivered by the provider on the OAuth2 callback.
#[derive(Debug, Clone, Deserialize)]
pub struct ProviderCallbackQuery {
    pub code: String,
    pub state: String,
}
