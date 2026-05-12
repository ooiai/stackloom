use super::resp::OpenApiUserProfileResp;
use crate::openapi::OAuthContext;
use neocrates::{
    axum::{Extension, Json, extract::State},
    response::error::AppResult,
    tracing,
};

use super::super::super::OpenApiHttpState;

pub type OpenApiV1UserState = OpenApiHttpState;

/// Return the authenticated user's profile derived from the validated OAuth2 token context.
pub async fn me(
    State(_state): State<OpenApiV1UserState>,
    Extension(ctx): Extension<OAuthContext>,
) -> AppResult<Json<OpenApiUserProfileResp>> {
    tracing::info!(
        user_id = ctx.user_id,
        tenant_id = ctx.tenant_id,
        "openapi v1 user me"
    );

    Ok(Json(OpenApiUserProfileResp {
        user_id: ctx.user_id,
        tenant_id: ctx.tenant_id,
        scopes: ctx.scopes,
    }))
}
