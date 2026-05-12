pub mod user;

use super::OpenApiHttpState;
use neocrates::axum::Router;

/// OpenAPI v1 router. Handlers in this module receive an injected [`super::OAuthContext`]
/// via Axum extensions (set by the parent `openapi_interceptor` middleware).
pub fn router(state: OpenApiHttpState) -> Router {
    Router::new().nest("/user", user::router(state))
}
