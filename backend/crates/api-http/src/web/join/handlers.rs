use super::{
    req::{JoinByInviteReq, ValidateInviteReq},
    resp::ValidateInviteResp,
};
use crate::web::WebHttpState;
use common::core::{biz_error, constants::CACHE_INVITE_CODE_LOOKUP};
use domain_base::NotificationEvent;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    serde_json::json,
    tokio, tracing,
};

/// Validate an invite code and return basic tenant information.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `req` - The request payload containing the invite code to validate.
///
/// # Returns
/// * `AppResult<Json<ValidateInviteResp>>` - On success, returns the tenant information associated with the invite code. On failure, returns an error indicating that the code is invalid or expired.
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

/// Submit a tenant join request via an invite code (authenticated).
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The authenticated user making the join request.
/// * `req` - The request payload containing the invite code to join with.
///
/// # Returns
/// * `AppResult<Json<()>>` - On success, returns an empty JSON object. On failure, returns an error indicating that the code is invalid, expired, or that the join request could not be processed.
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

    let membership = state
        .user_tenant_service
        .join_by_invite_code(auth_user.uid, tenant_id, None)
        .await?;

    let user_id = auth_user.uid;
    let username = auth_user.username.clone();
    let nickname = auth_user.nickname.clone();
    let fallback_tenant_name = auth_user.tname.clone();

    let tenant_name = state
        .tenant_service
        .get(tenant_id)
        .await
        .map(|tenant| tenant.name)
        .unwrap_or_else(|err| {
            tracing::warn!(tenant_id, error = %err, "failed to load tenant name for notification");
            fallback_tenant_name
        });

    let notification_service = state.notification_service.clone();
    let event = NotificationEvent {
        tenant_id,
        event_code: "member.join_requested".to_string(),
        actor_user_id: Some(user_id),
        source_type: Some("member".to_string()),
        source_id: Some(membership.id),
        template_vars: json!({
            "member": {
                "id": user_id,
                "username": username,
                "nickname": nickname,
            },
            "tenant": {
                "id": tenant_id,
                "name": tenant_name,
            },
        }),
        idempotency_key: Some(format!(
            "member.join_requested:{tenant_id}:{user_id}:{}",
            membership.id
        )),
        created_by: Some(user_id),
    };

    tokio::spawn(async move {
        if let Err(err) = notification_service.publish_event(event).await {
            tracing::warn!(tenant_id, user_id, error = %err, "failed to publish member.join_requested notification");
        }
    });

    Ok(Json(()))
}
