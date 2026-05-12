pub mod providers;
pub mod repo;
pub mod service;

pub use providers::{GitHubOAuthProvider, GoogleOAuthProvider, WeChatOAuthProvider};
pub use repo::SqlxOAuthRepository;
pub use service::OAuthServiceImpl;

use chrono::{DateTime, Utc};
use domain_auth::oauth::{OAuthClient, OAuthProviderBinding, OAuthToken};
use neocrates::sqlx::FromRow;

/// Database row for oauth_clients table.
#[derive(Debug, Clone, FromRow)]
pub struct OAuthClientRow {
    pub id: i64,
    pub tenant_id: i64,
    pub name: String,
    pub client_id: String,
    pub client_secret_hash: String,
    pub redirect_uris: Vec<String>,
    pub allowed_scopes: Vec<String>,
    pub status: i16,
    pub description: Option<String>,
}

impl From<OAuthClientRow> for OAuthClient {
    fn from(row: OAuthClientRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            client_id: row.client_id,
            client_secret_hash: row.client_secret_hash,
            redirect_uris: row.redirect_uris,
            allowed_scopes: row.allowed_scopes,
            status: row.status,
            description: row.description,
        }
    }
}

/// Database row for oauth_tokens table.
#[derive(Debug, Clone, FromRow)]
pub struct OAuthTokenRow {
    pub id: i64,
    pub oauth_client_id: i64,
    pub user_id: i64,
    pub tenant_id: i64,
    pub access_token: String,
    pub refresh_token: String,
    pub scopes: Vec<String>,
    pub access_token_expires_at: DateTime<Utc>,
    pub refresh_token_expires_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
}

impl From<OAuthTokenRow> for OAuthToken {
    fn from(row: OAuthTokenRow) -> Self {
        Self {
            id: row.id,
            oauth_client_id: row.oauth_client_id,
            user_id: row.user_id,
            tenant_id: row.tenant_id,
            access_token: row.access_token,
            refresh_token: row.refresh_token,
            scopes: row.scopes,
            access_token_expires_at: row.access_token_expires_at.timestamp(),
            refresh_token_expires_at: row.refresh_token_expires_at.timestamp(),
            revoked_at: row.revoked_at.map(|t| t.timestamp()),
        }
    }
}

/// Database row for oauth_providers table.
#[derive(Debug, Clone, FromRow)]
pub struct OAuthProviderRow {
    pub id: i64,
    pub user_id: i64,
    pub provider: String,
    pub provider_user_id: String,
    pub provider_username: Option<String>,
    pub provider_email: Option<String>,
}

impl From<OAuthProviderRow> for OAuthProviderBinding {
    fn from(row: OAuthProviderRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            provider: row.provider,
            provider_user_id: row.provider_user_id,
            provider_username: row.provider_username,
            provider_email: row.provider_email,
        }
    }
}
