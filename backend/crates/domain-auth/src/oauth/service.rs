use neocrates::{async_trait::async_trait, response::error::AppResult};

use super::{
    AuthorizeCmd, AuthorizeResult, BindOAuthProviderCmd, CreateOAuthClientCmd, ExchangeCodeCmd,
    OAuthClient, OAuthProviderBinding, OAuthProviderUserInfo, OAuthToken, RefreshOAuthTokenCmd,
    RevokeOAuthTokenCmd, UpdateOAuthClientCmd,
};

/// Domain service contract for all OAuth2 flows.
///
/// Covers client CRUD, authorization code issuance, token exchange/refresh/revoke,
/// and third-party provider binding management.
#[async_trait]
pub trait OAuthService: Send + Sync {
    // --- Client management ---

    /// Register a new OAuth2 client application.
    async fn create_client(&self, cmd: CreateOAuthClientCmd) -> AppResult<OAuthClient>;

    /// Get a single client by id.
    async fn get_client(&self, id: i64) -> AppResult<OAuthClient>;

    /// List OAuth2 clients for a tenant with optional keyword filter and pagination.
    async fn list_clients(
        &self,
        tenant_id: i64,
        keyword: Option<&str>,
        status: Option<i16>,
        limit: i64,
        offset: i64,
    ) -> AppResult<(Vec<OAuthClient>, i64)>;

    /// Update client metadata (name, redirect_uris, allowed_scopes, status, description).
    async fn update_client(&self, cmd: UpdateOAuthClientCmd) -> AppResult<()>;

    /// Soft-delete one or more clients.
    async fn delete_clients(&self, ids: Vec<i64>) -> AppResult<()>;

    /// Rotate the client secret. Returns the new plaintext secret (shown once).
    async fn rotate_client_secret(&self, id: i64) -> AppResult<String>;

    // --- Authorization code flow ---

    /// Issue an authorization code for the authenticated user.
    ///
    /// Validates the client, redirect_uri, scopes, and PKCE parameters.
    /// Stores the code + challenge in Redis with a 10-minute TTL.
    async fn authorize(&self, cmd: AuthorizeCmd) -> AppResult<AuthorizeResult>;

    /// Exchange an authorization code for an OAuth2 token pair.
    ///
    /// Validates the code, PKCE verifier, client credentials, and redirect_uri.
    async fn exchange_code(&self, cmd: ExchangeCodeCmd) -> AppResult<OAuthToken>;

    /// Refresh an access token using a valid refresh token.
    async fn refresh_token(&self, cmd: RefreshOAuthTokenCmd) -> AppResult<OAuthToken>;

    /// Revoke a token (access or refresh). RFC 7009 compliant — always returns Ok.
    async fn revoke_token(&self, cmd: RevokeOAuthTokenCmd) -> AppResult<()>;

    // --- Provider binding ---

    /// Bind a third-party provider identity to a user.
    async fn bind_provider(&self, cmd: BindOAuthProviderCmd) -> AppResult<OAuthProviderBinding>;

    /// Look up a provider binding by (provider, provider_user_id).
    async fn find_provider_binding(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> AppResult<Option<OAuthProviderBinding>>;

    // --- Third-party provider login ---

    /// Generate the authorization URL for a third-party provider and store CSRF state in Redis.
    ///
    /// Returns `(redirect_url, state)` where `state` must be passed back on callback.
    /// The `redirect_after` URL is stored in Redis alongside the state and returned to the
    /// frontend after successful authentication.
    async fn provider_login_url(
        &self,
        provider: &str,
        redirect_after: Option<String>,
    ) -> AppResult<(String, String)>;

    /// Exchange a provider callback code and validate the CSRF state.
    ///
    /// Validates the state against Redis, exchanges the code with the provider,
    /// and returns the provider user info plus the original redirect_after URL.
    async fn exchange_provider_code(
        &self,
        provider: &str,
        code: &str,
        state: &str,
    ) -> AppResult<(OAuthProviderUserInfo, Option<String>)>;
}
