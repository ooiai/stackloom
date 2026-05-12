use std::sync::Arc;

use common::core::biz_error::OAUTH_CLIENT_ID_EXISTS;
use domain_auth::oauth::{
    BindOAuthProviderCmd, CreateOAuthClientCmd, OAuthClient, OAuthProviderBinding, OAuthToken,
    OAuthRepository, RotateOAuthClientSecretCmd, UpdateOAuthClientCmd,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlx::{self, Error as SqlxError},
    sqlxhelper::pool::SqlxPool,
};

use super::{OAuthClientRow, OAuthProviderRow, OAuthTokenRow};

/// SQLx-backed repository for OAuth2 clients, tokens, and provider bindings.
#[derive(Debug, Clone)]
pub struct SqlxOAuthRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxOAuthRepository {
    /// Create a repository bound to the shared SQLx pool.
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505") {
                return match db_err.constraint() {
                    Some("uq_oauth_clients_client_id") => AppError::DataError(
                        OAUTH_CLIENT_ID_EXISTS,
                        "oauth client_id already exists".to_string(),
                    ),
                    Some(c) => AppError::data_here(format!(
                        "unexpected unique constraint violation ({c}): {}",
                        db_err.message()
                    )),
                    None => AppError::data_here(format!(
                        "unexpected unique constraint violation: {}",
                        db_err.message()
                    )),
                };
            }
        }
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl OAuthRepository for SqlxOAuthRepository {
    async fn create_client(&self, cmd: CreateOAuthClientCmd) -> AppResult<OAuthClient> {
        let id = generate_sonyflake_id() as i64;
        let row = sqlx::query_as::<_, OAuthClientRow>(
            r#"
            INSERT INTO oauth_clients (id, tenant_id, name, client_id, client_secret_hash,
                redirect_uris, allowed_scopes, status, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
            RETURNING id, tenant_id, name, client_id, client_secret_hash,
                      redirect_uris, allowed_scopes, status, description
            "#,
        )
        .bind(id)
        .bind(cmd.tenant_id)
        .bind(&cmd.name)
        .bind(&cmd.client_id)
        .bind(&cmd.client_secret_hash)
        .bind(&cmd.redirect_uris)
        .bind(&cmd.allowed_scopes)
        .bind(&cmd.description)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(OAuthClient::from(row))
    }

    async fn find_client_by_id(&self, id: i64) -> AppResult<Option<OAuthClient>> {
        let row = sqlx::query_as::<_, OAuthClientRow>(
            r#"
            SELECT id, tenant_id, name, client_id, client_secret_hash,
                   redirect_uris, allowed_scopes, status, description
            FROM oauth_clients
            WHERE id = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(row.map(OAuthClient::from))
    }

    async fn find_client_by_client_id(&self, client_id: &str) -> AppResult<Option<OAuthClient>> {
        let row = sqlx::query_as::<_, OAuthClientRow>(
            r#"
            SELECT id, tenant_id, name, client_id, client_secret_hash,
                   redirect_uris, allowed_scopes, status, description
            FROM oauth_clients
            WHERE client_id = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(client_id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(row.map(OAuthClient::from))
    }

    async fn list_clients(
        &self,
        tenant_id: i64,
        keyword: Option<&str>,
        status: Option<i16>,
        limit: i64,
        offset: i64,
    ) -> AppResult<(Vec<OAuthClient>, i64)> {
        let kw = keyword
            .filter(|s| !s.trim().is_empty())
            .map(|s| format!("%{}%", s));

        let rows = sqlx::query_as::<_, OAuthClientRow>(
            r#"
            SELECT id, tenant_id, name, client_id, client_secret_hash,
                   redirect_uris, allowed_scopes, status, description
            FROM oauth_clients
            WHERE tenant_id = $1
              AND deleted_at IS NULL
              AND ($2::smallint IS NULL OR status = $2)
              AND ($3::text IS NULL OR name ILIKE $3)
            ORDER BY id DESC
            LIMIT $4 OFFSET $5
            "#,
        )
        .bind(tenant_id)
        .bind(status)
        .bind(&kw)
        .bind(limit)
        .bind(offset)
        .fetch_all(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM oauth_clients
            WHERE tenant_id = $1
              AND deleted_at IS NULL
              AND ($2::smallint IS NULL OR status = $2)
              AND ($3::text IS NULL OR name ILIKE $3)
            "#,
        )
        .bind(tenant_id)
        .bind(status)
        .bind(&kw)
        .fetch_one(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok((rows.into_iter().map(OAuthClient::from).collect(), total.0))
    }

    async fn update_client(&self, cmd: UpdateOAuthClientCmd) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE oauth_clients
            SET name           = COALESCE($2, name),
                redirect_uris  = COALESCE($3, redirect_uris),
                allowed_scopes = COALESCE($4, allowed_scopes),
                status         = COALESCE($5, status),
                description    = COALESCE($6, description),
                updated_at     = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(cmd.id)
        .bind(&cmd.name)
        .bind(&cmd.redirect_uris)
        .bind(&cmd.allowed_scopes)
        .bind(cmd.status)
        .bind(&cmd.description)
        .execute(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(())
    }

    async fn rotate_client_secret(&self, cmd: RotateOAuthClientSecretCmd) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE oauth_clients
            SET client_secret_hash = $2, updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            "#,
        )
        .bind(cmd.id)
        .bind(&cmd.new_client_secret)
        .execute(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(())
    }

    async fn delete_clients(&self, ids: Vec<i64>) -> AppResult<()> {
        sqlx::query(
            r#"UPDATE oauth_clients SET deleted_at = NOW() WHERE id = ANY($1)"#,
        )
        .bind(&ids)
        .execute(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(())
    }

    async fn create_token(&self, token: OAuthToken) -> AppResult<OAuthToken> {
        use chrono::{TimeZone, Utc};

        let access_exp = Utc
            .timestamp_opt(token.access_token_expires_at, 0)
            .single()
            .unwrap_or_else(Utc::now);
        let refresh_exp = Utc
            .timestamp_opt(token.refresh_token_expires_at, 0)
            .single()
            .unwrap_or_else(Utc::now);

        let row = sqlx::query_as::<_, OAuthTokenRow>(
            r#"
            INSERT INTO oauth_tokens (id, oauth_client_id, user_id, tenant_id,
                access_token, refresh_token, scopes,
                access_token_expires_at, refresh_token_expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, oauth_client_id, user_id, tenant_id,
                      access_token, refresh_token, scopes,
                      access_token_expires_at, refresh_token_expires_at, revoked_at
            "#,
        )
        .bind(token.id)
        .bind(token.oauth_client_id)
        .bind(token.user_id)
        .bind(token.tenant_id)
        .bind(&token.access_token)
        .bind(&token.refresh_token)
        .bind(&token.scopes)
        .bind(access_exp)
        .bind(refresh_exp)
        .fetch_one(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(OAuthToken::from(row))
    }

    async fn find_token_by_access_token(
        &self,
        access_token: &str,
    ) -> AppResult<Option<OAuthToken>> {
        let row = sqlx::query_as::<_, OAuthTokenRow>(
            r#"
            SELECT id, oauth_client_id, user_id, tenant_id,
                   access_token, refresh_token, scopes,
                   access_token_expires_at, refresh_token_expires_at, revoked_at
            FROM oauth_tokens
            WHERE access_token = $1
            "#,
        )
        .bind(access_token)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(row.map(OAuthToken::from))
    }

    async fn find_token_by_refresh_token(
        &self,
        refresh_token: &str,
    ) -> AppResult<Option<OAuthToken>> {
        let row = sqlx::query_as::<_, OAuthTokenRow>(
            r#"
            SELECT id, oauth_client_id, user_id, tenant_id,
                   access_token, refresh_token, scopes,
                   access_token_expires_at, refresh_token_expires_at, revoked_at
            FROM oauth_tokens
            WHERE refresh_token = $1
            "#,
        )
        .bind(refresh_token)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(row.map(OAuthToken::from))
    }

    async fn revoke_token_by_access_token(&self, access_token: &str) -> AppResult<()> {
        sqlx::query(
            r#"UPDATE oauth_tokens SET revoked_at = NOW() WHERE access_token = $1 AND revoked_at IS NULL"#,
        )
        .bind(access_token)
        .execute(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(())
    }

    async fn revoke_token_by_refresh_token(&self, refresh_token: &str) -> AppResult<()> {
        sqlx::query(
            r#"UPDATE oauth_tokens SET revoked_at = NOW() WHERE refresh_token = $1 AND revoked_at IS NULL"#,
        )
        .bind(refresh_token)
        .execute(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(())
    }

    async fn create_provider_binding(
        &self,
        cmd: BindOAuthProviderCmd,
    ) -> AppResult<OAuthProviderBinding> {
        let id = generate_sonyflake_id() as i64;
        let info = &cmd.provider_info;
        let row = sqlx::query_as::<_, OAuthProviderRow>(
            r#"
            INSERT INTO oauth_providers (id, user_id, provider, provider_user_id,
                provider_username, provider_email)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (provider, provider_user_id) DO UPDATE
                SET provider_username = EXCLUDED.provider_username,
                    provider_email    = EXCLUDED.provider_email,
                    updated_at        = NOW()
            RETURNING id, user_id, provider, provider_user_id, provider_username, provider_email
            "#,
        )
        .bind(id)
        .bind(cmd.user_id)
        .bind(&info.provider)
        .bind(&info.provider_user_id)
        .bind(&info.provider_username)
        .bind(&info.provider_email)
        .fetch_one(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(OAuthProviderBinding::from(row))
    }

    async fn find_provider_binding(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> AppResult<Option<OAuthProviderBinding>> {
        let row = sqlx::query_as::<_, OAuthProviderRow>(
            r#"
            SELECT id, user_id, provider, provider_user_id, provider_username, provider_email
            FROM oauth_providers
            WHERE provider = $1 AND provider_user_id = $2
            "#,
        )
        .bind(provider)
        .bind(provider_user_id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(|e| AppError::data_here(e.to_string()))?;

        Ok(row.map(OAuthProviderBinding::from))
    }
}
