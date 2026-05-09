use super::{
    req::{JoinByInviteReq, ValidateInviteReq},
    resp::ValidateInviteResp,
};
use crate::web::WebHttpState;
use common::core::{biz_error, constants::CACHE_INVITE_CODE_LOOKUP};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};

/// Validate an invite code and return basic tenant information.
///
/// This is a public endpoint (no authentication required). It looks up the
/// invite code in Redis and returns the associated tenant's name and slug so
/// the join page can display a preview before the user authenticates.
pub async fn validate_invite(
    State(state): State<WebHttpState>,
    DetailedJson(req): DetailedJson<ValidateInviteReq>,
) -> AppResult<Json<ValidateInviteResp>> {
    tracing::info!("...Web Join ValidateInvite: code={}...", req.invite_code);

    let lookup_key = format!(
        "{}{}{}",
        state.cfg.server.prefix, CACHE_INVITE_CODE_LOOKUP, req.invite_code
    );

    let tenant_id_str = state
        .redis_pool
        .get::<_, String>(&lookup_key)
        .await
        .ok()
        .flatten()
        .ok_or_else(|| {
            AppError::DataError(
                biz_error::INVITE_CODE_INVALID,
                format!("invite code not found or expired: {}", req.invite_code),
            )
        })?;

    let tenant_id: i64 = tenant_id_str.parse().map_err(|_| {
        AppError::DataError(
            biz_error::INVITE_CODE_INVALID,
            format!("invalid tenant_id in invite lookup: {tenant_id_str}"),
        )
    })?;

    let tenant = state.tenant_service.get(tenant_id).await?;

    Ok(Json(ValidateInviteResp {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
    }))
}

/// Join a tenant via an invite code (authenticated).
///
/// Looks up the invite code, resolves the target tenant, and creates a
/// membership record for the calling user. Returns an error if the code is
/// invalid or the user is already a member.
pub async fn join(
    State(state): State<WebHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<JoinByInviteReq>,
) -> AppResult<Json<()>> {
    tracing::info!(
        "...Web Join: uid={}, code={}...",
        auth_user.uid,
        req.invite_code
    );

    let lookup_key = format!(
        "{}{}{}",
        state.cfg.server.prefix, CACHE_INVITE_CODE_LOOKUP, req.invite_code
    );

    let tenant_id_str = state
        .redis_pool
        .get::<_, String>(&lookup_key)
        .await
        .ok()
        .flatten()
        .ok_or_else(|| {
            AppError::DataError(
                biz_error::INVITE_CODE_INVALID,
                format!("invite code not found or expired: {}", req.invite_code),
            )
        })?;

    let tenant_id: i64 = tenant_id_str.parse().map_err(|_| {
        AppError::DataError(
            biz_error::INVITE_CODE_INVALID,
            format!("invalid tenant_id in invite lookup: {tenant_id_str}"),
        )
    })?;

    state
        .user_tenant_service
        .join_by_invite_code(auth_user.uid, tenant_id, None)
        .await?;

    Ok(Json(()))
}
