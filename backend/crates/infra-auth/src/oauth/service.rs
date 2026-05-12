use std::{collections::HashMap, sync::Arc};

use chrono::Utc;
use common::core::{
    biz_error::{
        OAUTH_CLIENT_DISABLED, OAUTH_CLIENT_NOT_FOUND, OAUTH_CLIENT_SECRET_INVALID,
        OAUTH_CODE_INVALID, OAUTH_PKCE_INVALID, OAUTH_PROVIDER_NOT_FOUND, OAUTH_REDIRECT_URI_MISMATCH,
        OAUTH_SCOPE_INVALID, OAUTH_STATE_INVALID, OAUTH_TOKEN_INVALID,
    },
    constants::{CACHE_OAUTH_CODE, CACHE_OAUTH_PROVIDER_STATE},
};
use domain_auth::oauth::{
    AuthorizeCmd, AuthorizeResult, BindOAuthProviderCmd, CreateOAuthClientCmd, ExchangeCodeCmd,
    OAuthClient, OAuthProvider, OAuthProviderBinding, OAuthProviderUserInfo, OAuthRepository,
    OAuthService, OAuthToken, RefreshOAuthTokenCmd, RevokeOAuthTokenCmd,
    RotateOAuthClientSecretCmd, UpdateOAuthClientCmd,
};
use neocrates::{
    async_trait::async_trait,
    base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD},
    crypto::core::Crypto,
    helper::core::snowflake::generate_sonyflake_id,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    serde::{Deserialize, Serialize},
    serde_json,
    sha2::{Digest, Sha256},
    uuid::Uuid,
};

/// OAuth2 service implementation: authorization code, PKCE, token issuing, rotation.
#[derive(Clone)]
pub struct OAuthServiceImpl {
    repo: Arc<dyn OAuthRepository>,
    redis: Arc<RedisPool>,
    redis_prefix: String,
    providers: HashMap<String, Arc<dyn OAuthProvider>>,
}

impl OAuthServiceImpl {
    pub fn new(
        repo: Arc<dyn OAuthRepository>,
        redis: Arc<RedisPool>,
        redis_prefix: String,
        providers: HashMap<String, Arc<dyn OAuthProvider>>,
    ) -> Self {
        Self {
            repo,
            redis,
            redis_prefix,
            providers,
        }
    }

    fn auth_code_key(&self, code: &str) -> String {
        format!("{}{}{}", self.redis_prefix, CACHE_OAUTH_CODE, code)
    }

    fn provider_state_key(&self, state: &str) -> String {
        format!("{}{}{}", self.redis_prefix, CACHE_OAUTH_PROVIDER_STATE, state)
    }

    /// Generate 32 cryptographically random bytes and return as a 64-char hex string.
    fn random_hex64() -> String {
        let mut bytes = [0u8; 32];
        neocrates::rand::fill(&mut bytes);
        neocrates::hex::encode(&bytes)
    }

    /// Compute SHA-256 of `verifier` and base64url-encode (no padding).
    fn pkce_s256(verifier: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(verifier.as_bytes());
        let digest = hasher.finalize();
        URL_SAFE_NO_PAD.encode(digest)
    }
}

/// JSON payload stored in Redis for a pending authorization code.
#[derive(Serialize, Deserialize)]
struct AuthCodePayload {
    user_id: i64,
    tenant_id: i64,
    client_id: i64,
    scopes: Vec<String>,
    redirect_uri: String,
    code_challenge: String,
}

/// JSON payload stored in Redis to associate a CSRF state token with a provider name and an
/// optional post-login redirect URL.
#[derive(Serialize, Deserialize)]
struct ProviderStatePayload {
    provider: String,
    redirect_after: Option<String>,
}

#[async_trait]
impl OAuthService for OAuthServiceImpl {
    async fn create_client(&self, mut cmd: CreateOAuthClientCmd) -> AppResult<OAuthClient> {
        cmd.validate()?;
        cmd.client_id = Uuid::new_v4().to_string().replace('-', "");
        cmd.client_secret_hash = Crypto::hash_password(&cmd.client_secret)
            .map_err(|e| AppError::data_here(e.to_string()))?;
        self.repo.create_client(cmd).await
    }

    async fn get_client(&self, id: i64) -> AppResult<OAuthClient> {
        self.repo
            .find_client_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("oauth client {} not found", id)))
    }

    async fn list_clients(
        &self,
        tenant_id: i64,
        keyword: Option<&str>,
        status: Option<i16>,
        limit: i64,
        offset: i64,
    ) -> AppResult<(Vec<OAuthClient>, i64)> {
        self.repo
            .list_clients(tenant_id, keyword, status, limit, offset)
            .await
    }

    async fn update_client(&self, cmd: UpdateOAuthClientCmd) -> AppResult<()> {
        self.repo.update_client(cmd).await
    }

    async fn delete_clients(&self, ids: Vec<i64>) -> AppResult<()> {
        self.repo.delete_clients(ids).await
    }

    async fn rotate_client_secret(&self, id: i64) -> AppResult<String> {
        let plaintext = Self::random_hex64();
        let hash = Crypto::hash_password(&plaintext)
            .map_err(|e| AppError::data_here(e.to_string()))?;
        self.repo
            .rotate_client_secret(RotateOAuthClientSecretCmd {
                id,
                new_client_secret: hash,
            })
            .await?;
        Ok(plaintext)
    }

    async fn authorize(&self, cmd: AuthorizeCmd) -> AppResult<AuthorizeResult> {
        cmd.validate()?;

        let client = self
            .repo
            .find_client_by_client_id(&cmd.client_id)
            .await?
            .ok_or_else(|| AppError::DataError(OAUTH_CLIENT_NOT_FOUND, cmd.client_id.clone()))?;

        if client.status != 1 {
            return Err(AppError::DataError(
                OAUTH_CLIENT_DISABLED,
                "oauth client is disabled".to_string(),
            ));
        }

        if !client.redirect_uris.contains(&cmd.redirect_uri) {
            return Err(AppError::DataError(
                OAUTH_REDIRECT_URI_MISMATCH,
                format!("redirect_uri '{}' not registered", cmd.redirect_uri),
            ));
        }

        for scope in &cmd.scopes {
            if !client.allowed_scopes.contains(scope) {
                return Err(AppError::DataError(
                    OAUTH_SCOPE_INVALID,
                    format!("scope '{}' not allowed", scope),
                ));
            }
        }

        let code = Self::random_hex64();
        let payload = AuthCodePayload {
            user_id: cmd.user_id,
            tenant_id: cmd.tenant_id,
            client_id: client.id,
            scopes: cmd.scopes,
            redirect_uri: cmd.redirect_uri,
            code_challenge: cmd.code_challenge,
        };
        let json = serde_json::to_string(&payload)
            .map_err(|e| AppError::data_here(e.to_string()))?;

        self.redis
            .setex(&self.auth_code_key(&code), json, 600)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(AuthorizeResult {
            code,
            state: cmd.state,
        })
    }

    async fn exchange_code(&self, cmd: ExchangeCodeCmd) -> AppResult<OAuthToken> {
        cmd.validate()?;

        let key = self.auth_code_key(&cmd.code);
        let raw: Option<String> = self
            .redis
            .get::<_, String>(&key)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        let raw = raw.ok_or_else(|| {
            AppError::DataError(
                OAUTH_CODE_INVALID,
                "authorization code not found or expired".to_string(),
            )
        })?;

        // Single-use: delete before verifying so we don't leave it on error paths.
        self.redis
            .del(&key)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        let payload: AuthCodePayload =
            serde_json::from_str(&raw).map_err(|e| AppError::data_here(e.to_string()))?;

        // PKCE S256 verification
        let expected_challenge = Self::pkce_s256(&cmd.code_verifier);
        if expected_challenge != payload.code_challenge {
            return Err(AppError::DataError(
                OAUTH_PKCE_INVALID,
                "PKCE verification failed".to_string(),
            ));
        }

        // redirect_uri must match
        if cmd.redirect_uri != payload.redirect_uri {
            return Err(AppError::DataError(
                OAUTH_REDIRECT_URI_MISMATCH,
                "redirect_uri mismatch".to_string(),
            ));
        }

        // Verify client credentials
        let client = self
            .repo
            .find_client_by_client_id(&cmd.client_id)
            .await?
            .ok_or_else(|| AppError::DataError(OAUTH_CLIENT_NOT_FOUND, cmd.client_id.clone()))?;

        if client.id != payload.client_id {
            return Err(AppError::DataError(
                OAUTH_CLIENT_SECRET_INVALID,
                "client_id does not match issued code".to_string(),
            ));
        }

        if !Crypto::verify_password(&cmd.client_secret, &client.client_secret_hash) {
            return Err(AppError::DataError(
                OAUTH_CLIENT_SECRET_INVALID,
                "invalid client_secret".to_string(),
            ));
        }

        let now = Utc::now().timestamp();
        let token_id = generate_sonyflake_id() as i64;

        let token = OAuthToken {
            id: token_id,
            oauth_client_id: client.id,
            user_id: payload.user_id,
            tenant_id: payload.tenant_id,
            access_token: Self::random_hex64(),
            refresh_token: Self::random_hex64(),
            scopes: payload.scopes,
            access_token_expires_at: now + 900,
            refresh_token_expires_at: now + 2_592_000,
            revoked_at: None,
        };

        self.repo.create_token(token).await
    }

    async fn refresh_token(&self, cmd: RefreshOAuthTokenCmd) -> AppResult<OAuthToken> {
        cmd.validate()?;

        let old = self
            .repo
            .find_token_by_refresh_token(&cmd.refresh_token)
            .await?
            .ok_or_else(|| {
                AppError::DataError(OAUTH_TOKEN_INVALID, "refresh_token not found".to_string())
            })?;

        if old.revoked_at.is_some() {
            return Err(AppError::DataError(
                OAUTH_TOKEN_INVALID,
                "refresh_token has been revoked".to_string(),
            ));
        }

        let now = Utc::now().timestamp();
        if old.refresh_token_expires_at < now {
            return Err(AppError::DataError(
                OAUTH_TOKEN_INVALID,
                "refresh_token has expired".to_string(),
            ));
        }

        let client = self
            .repo
            .find_client_by_client_id(&cmd.client_id)
            .await?
            .ok_or_else(|| AppError::DataError(OAUTH_CLIENT_NOT_FOUND, cmd.client_id.clone()))?;

        if client.id != old.oauth_client_id {
            return Err(AppError::DataError(
                OAUTH_CLIENT_SECRET_INVALID,
                "client_id does not match token".to_string(),
            ));
        }

        if !Crypto::verify_password(&cmd.client_secret, &client.client_secret_hash) {
            return Err(AppError::DataError(
                OAUTH_CLIENT_SECRET_INVALID,
                "invalid client_secret".to_string(),
            ));
        }

        self.repo
            .revoke_token_by_refresh_token(&cmd.refresh_token)
            .await?;

        let token_id = generate_sonyflake_id() as i64;

        let token = OAuthToken {
            id: token_id,
            oauth_client_id: old.oauth_client_id,
            user_id: old.user_id,
            tenant_id: old.tenant_id,
            access_token: Self::random_hex64(),
            refresh_token: Self::random_hex64(),
            scopes: old.scopes,
            access_token_expires_at: now + 900,
            refresh_token_expires_at: now + 2_592_000,
            revoked_at: None,
        };

        self.repo.create_token(token).await
    }

    async fn revoke_token(&self, cmd: RevokeOAuthTokenCmd) -> AppResult<()> {
        // RFC 7009: always Ok, even if token is invalid or already revoked.
        let _ = self.repo.revoke_token_by_access_token(&cmd.token).await;
        let _ = self.repo.revoke_token_by_refresh_token(&cmd.token).await;
        Ok(())
    }

    async fn bind_provider(&self, cmd: BindOAuthProviderCmd) -> AppResult<OAuthProviderBinding> {
        self.repo.create_provider_binding(cmd).await
    }

    async fn find_provider_binding(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> AppResult<Option<OAuthProviderBinding>> {
        self.repo
            .find_provider_binding(provider, provider_user_id)
            .await
    }

    async fn provider_login_url(
        &self,
        provider: &str,
        redirect_after: Option<String>,
    ) -> AppResult<(String, String)> {
        let p = self.providers.get(provider).ok_or_else(|| {
            AppError::DataError(OAUTH_PROVIDER_NOT_FOUND, format!("provider '{}' not configured", provider))
        })?;

        let state = Self::random_hex64();
        let payload = ProviderStatePayload {
            provider: provider.to_string(),
            redirect_after,
        };
        let json = serde_json::to_string(&payload)
            .map_err(|e| AppError::data_here(e.to_string()))?;

        self.redis
            .setex(&self.provider_state_key(&state), json, 600)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        let url = p.login_url(&state);
        Ok((url, state))
    }

    async fn exchange_provider_code(
        &self,
        provider: &str,
        code: &str,
        state: &str,
    ) -> AppResult<(OAuthProviderUserInfo, Option<String>)> {
        let key = self.provider_state_key(state);
        let raw: Option<String> = self
            .redis
            .get::<_, String>(&key)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        let raw = raw.ok_or_else(|| {
            AppError::DataError(OAUTH_STATE_INVALID, "provider state not found or expired".to_string())
        })?;

        // Single-use: delete before verifying so we don't leave it on error paths.
        self.redis
            .del(&key)
            .await
            .map_err(|e| AppError::data_here(e.to_string()))?;

        let payload: ProviderStatePayload =
            serde_json::from_str(&raw).map_err(|e| AppError::data_here(e.to_string()))?;

        if payload.provider != provider {
            return Err(AppError::DataError(
                OAUTH_STATE_INVALID,
                format!("provider mismatch: expected '{}', got '{}'", payload.provider, provider),
            ));
        }

        let p = self.providers.get(provider).ok_or_else(|| {
            AppError::DataError(OAUTH_PROVIDER_NOT_FOUND, format!("provider '{}' not configured", provider))
        })?;

        let info = p.exchange_code(code).await?;
        Ok((info, payload.redirect_after))
    }
}
