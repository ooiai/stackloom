use neocrates::{async_trait::async_trait, response::error::AppResult};

use super::{
    BindOAuthProviderCmd, CreateOAuthClientCmd, OAuthClient, OAuthProviderBinding, OAuthToken,
    RotateOAuthClientSecretCmd, UpdateOAuthClientCmd,
};

/// Repository contract for OAuth2 persistence (clients, tokens, provider bindings).
///
/// Implementations must live in `infra-auth`. Domain code calls this trait only.
#[async_trait]
pub trait OAuthRepository: Send + Sync {
    // --- Client operations ---

    /// Persist a new OAuth2 client. Returns the created client with its generated id.
    async fn create_client(&self, cmd: CreateOAuthClientCmd) -> AppResult<OAuthClient>;

    /// Load an OAuth2 client by primary key, excluding soft-deleted records.
    async fn find_client_by_id(&self, id: i64) -> AppResult<Option<OAuthClient>>;

    /// Load an OAuth2 client by its public `client_id` string.
    async fn find_client_by_client_id(&self, client_id: &str) -> AppResult<Option<OAuthClient>>;

    /// List active OAuth2 clients for a tenant with pagination.
    async fn list_clients(
        &self,
        tenant_id: i64,
        keyword: Option<&str>,
        status: Option<i16>,
        limit: i64,
        offset: i64,
    ) -> AppResult<(Vec<OAuthClient>, i64)>;

    /// Apply partial updates to a client record.
    async fn update_client(&self, cmd: UpdateOAuthClientCmd) -> AppResult<()>;

    /// Rotate the hashed client secret.
    async fn rotate_client_secret(&self, cmd: RotateOAuthClientSecretCmd) -> AppResult<()>;

    /// Soft-delete one or more clients.
    async fn delete_clients(&self, ids: Vec<i64>) -> AppResult<()>;

    // --- Token operations ---

    /// Persist a new OAuth2 token pair. Returns the created token record.
    async fn create_token(&self, token: OAuthToken) -> AppResult<OAuthToken>;

    /// Load a token record by access_token value.
    async fn find_token_by_access_token(&self, access_token: &str) -> AppResult<Option<OAuthToken>>;

    /// Load a token record by refresh_token value.
    async fn find_token_by_refresh_token(
        &self,
        refresh_token: &str,
    ) -> AppResult<Option<OAuthToken>>;

    /// Mark a token pair as revoked (sets revoked_at to NOW).
    async fn revoke_token_by_access_token(&self, access_token: &str) -> AppResult<()>;

    /// Mark a token pair as revoked by refresh_token.
    async fn revoke_token_by_refresh_token(&self, refresh_token: &str) -> AppResult<()>;

    // --- Provider binding operations ---

    /// Persist a new provider binding.
    async fn create_provider_binding(
        &self,
        cmd: BindOAuthProviderCmd,
    ) -> AppResult<OAuthProviderBinding>;

    /// Find a provider binding by (provider, provider_user_id).
    async fn find_provider_binding(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> AppResult<Option<OAuthProviderBinding>>;
}
