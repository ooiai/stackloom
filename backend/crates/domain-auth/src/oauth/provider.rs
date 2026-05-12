use neocrates::{async_trait::async_trait, response::error::AppResult};

use super::OAuthProviderUserInfo;

/// Abstraction for a third-party OAuth2 identity provider.
///
/// Each concrete implementation (Google, GitHub, WeChat) handles the
/// provider-specific URL construction and token exchange protocol.
#[async_trait]
pub trait OAuthProvider: Send + Sync {
    /// The canonical provider name stored in oauth_providers table (e.g. "google").
    fn name(&self) -> &'static str;

    /// Build the provider authorization URL including state parameter for CSRF protection.
    fn login_url(&self, state: &str) -> String;

    /// Exchange a provider authorization code for user identity information.
    async fn exchange_code(&self, code: &str) -> AppResult<OAuthProviderUserInfo>;
}
