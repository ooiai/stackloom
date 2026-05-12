pub mod v1;

use std::sync::Arc;

use domain_auth::oauth::OAuthRepository;
use neocrates::{
    axum::{
        Router,
        body::Body,
        extract::State,
        http::{Request, StatusCode},
        middleware::{self, Next},
        response::{IntoResponse, Response},
    },
    chrono::Utc,
    tracing,
};

/// Shared state for all OpenAPI v1 routes. Holds the OAuth2 repository for Bearer token validation.
#[derive(Clone)]
pub struct OpenApiHttpState {
    pub oauth_repo: Arc<dyn OAuthRepository>,
}

/// The OAuth2 context injected by the `openapi_interceptor` middleware into request extensions.
#[derive(Debug, Clone)]
pub struct OAuthContext {
    pub user_id: i64,
    pub tenant_id: i64,
    pub scopes: Vec<String>,
    pub access_token: String,
}

/// Middleware: validate the Bearer access token and inject [`OAuthContext`] into extensions.
///
/// Returns `401 Unauthorized` when:
/// - The `Authorization` header is absent or malformed.
/// - The access token is not found in the database.
/// - The access token is revoked or expired.
pub async fn openapi_interceptor(
    State(state): State<OpenApiHttpState>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let bearer = req
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let Some(token_str) = bearer else {
        tracing::warn!("openapi interceptor: missing or malformed Authorization header");
        return StatusCode::UNAUTHORIZED.into_response();
    };

    let now = Utc::now().timestamp();

    match state.oauth_repo.find_token_by_access_token(token_str).await {
        Ok(Some(token)) => {
            if token.revoked_at.is_some() {
                tracing::warn!("openapi interceptor: token is revoked");
                return StatusCode::UNAUTHORIZED.into_response();
            }
            if token.access_token_expires_at < now {
                tracing::warn!("openapi interceptor: token has expired");
                return StatusCode::UNAUTHORIZED.into_response();
            }
            req.extensions_mut().insert(OAuthContext {
                user_id: token.user_id,
                tenant_id: token.tenant_id,
                scopes: token.scopes,
                access_token: token.access_token,
            });
            next.run(req).await
        }
        Ok(None) => {
            tracing::warn!("openapi interceptor: token not found");
            StatusCode::UNAUTHORIZED.into_response()
        }
        Err(e) => {
            tracing::error!("openapi interceptor: error validating token: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

/// Build the `/openapi` router with the Bearer-token interceptor applied.
pub fn router(state: OpenApiHttpState) -> Router {
    Router::new()
        .nest("/v1", v1::router(state.clone()))
        .layer(middleware::from_fn_with_state(state, openapi_interceptor))
}
