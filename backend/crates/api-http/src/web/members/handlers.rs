use super::{
    req::{PageMembersReq, UpdateMemberStatusReq},
    resp::{InviteCodeResp, PaginateMembersResp, TenantMemberResp},
};
use crate::web::WebHttpState;
use common::core::constants::{CACHE_INVITE_CODE, CACHE_INVITE_CODE_LOOKUP};
use domain_base::{NotificationEvent, PageTenantMemberCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::AppResult,
    serde_json::json,
    tokio, tracing,
    uuid::Uuid,
};

/// Page tenant members with optional keyword filtering.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The authenticated user information extracted from the request context.
/// * `req` - The request payload containing pagination and filtering parameters for notification dispatches.
///
/// # Returns
/// * `AppResult<Json<PaginateMembersResp>>` - A paginated list of tenant members matching the criteria, or an error if the operation fails.
pub async fn page(
    State(state): State<WebHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageMembersReq>,
) -> AppResult<Json<PaginateMembersResp>> {
    tracing::info!(
        "...Web Members Page Req: tid={}, keyword={:?}...",
        auth_user.tid,
        req.keyword
    );

    let cmd = PageTenantMemberCmd {
        tenant_id: auth_user.tid,
        keyword: req.keyword,
        limit: req.limit,
        offset: req.offset,
    };

    let (members, total) = state.user_tenant_service.page_members(cmd).await?;

    Ok(Json(PaginateMembersResp::new(
        members.into_iter().map(TenantMemberResp::from).collect(),
        total,
    )))
}

/// Update the status of a tenant member.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The authenticated user information extracted from the request context.
/// * `req` - The request payload containing the member ID and the new status to be applied.
///
/// # Returns
/// * `AppResult<Json<()>>` - An empty JSON response indicating success, or an error if the operation fails.
pub async fn update_status(
    State(state): State<WebHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<UpdateMemberStatusReq>,
) -> AppResult<Json<()>> {
    tracing::info!(
        "...Web Members UpdateStatus: tid={}, member_id={}, status={}...",
        auth_user.tid,
        req.member_id,
        req.status
    );

    let target_before = state.user_tenant_service.get(req.member_id).await?;
    state
        .user_tenant_service
        .update_member_status(req.member_id, auth_user.uid, auth_user.tid, req.status)
        .await?;
    if let Err(err) = state
        .shared_context_service
        .invalidate_by_user_tenant(target_before.user_id, auth_user.tid)
        .await
    {
        tracing::warn!(
            tenant_id = auth_user.tid,
            user_id = target_before.user_id,
            error = %err,
            "failed to invalidate shared context after member status update"
        );
    }

    if target_before.tenant_id == auth_user.tid && target_before.status == 2 {
        let event_code = match req.status {
            1 => Some("member.approved"),
            0 => Some("member.rejected"),
            _ => None,
        };

        if let Some(event_code) = event_code {
            let notification_service = state.notification_service.clone();
            let event = NotificationEvent {
                tenant_id: auth_user.tid,
                event_code: event_code.to_string(),
                actor_user_id: Some(target_before.user_id),
                source_type: Some("member".to_string()),
                source_id: Some(target_before.id),
                template_vars: json!({
                    "member": {
                        "id": target_before.user_id,
                    },
                    "tenant": {
                        "id": auth_user.tid,
                        "name": auth_user.tname,
                    },
                    "operator": {
                        "id": auth_user.uid,
                        "username": auth_user.username,
                        "nickname": auth_user.nickname,
                    },
                }),
                idempotency_key: Some(format!(
                    "{event_code}:{}:{}",
                    auth_user.tid, target_before.id
                )),
                created_by: Some(auth_user.uid),
            };

            tokio::spawn(async move {
                if let Err(err) = notification_service.publish_event(event).await {
                    tracing::warn!(tenant_id = auth_user.tid, member_id = target_before.id, error = %err, "failed to publish member review notification");
                }
            });
        }
    }

    Ok(Json(()))
}

/// Get or generate an invite code for the current tenant.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The authenticated user information extracted from the request context.
///
/// # Returns
/// * `AppResult<Json<InviteCodeResp>>` - The invite code for the tenant, either retrieved from cache or newly generated, or an error if the operation fails.
pub async fn invite_code(
    State(state): State<WebHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<InviteCodeResp>> {
    let key = format!(
        "{}{}{}",
        state.cfg.server.prefix, CACHE_INVITE_CODE, auth_user.tid
    );

    if let Ok(Some(code)) = state.redis_pool.get::<_, String>(&key).await {
        return Ok(Json(InviteCodeResp { invite_code: code }));
    }

    let code = Uuid::new_v4().to_string();
    // TTL: 7 days = 604800 seconds
    const INVITE_TTL: u64 = 604_800;
    if let Err(e) = state.redis_pool.setex(&key, &code, INVITE_TTL).await {
        tracing::warn!(tenant_id = %auth_user.tid, error = %e, "invite_code: failed to cache invite code");
    }

    // Store reverse mapping so validate-invite can look up tenant_id from UUID.
    let lookup_key = format!(
        "{}{}{}",
        state.cfg.server.prefix, CACHE_INVITE_CODE_LOOKUP, code
    );
    let tid_str = auth_user.tid.to_string();
    if let Err(e) = state
        .redis_pool
        .setex(&lookup_key, &tid_str, INVITE_TTL)
        .await
    {
        tracing::warn!(tenant_id = %auth_user.tid, error = %e, "invite_code: failed to cache invite code lookup");
    }

    Ok(Json(InviteCodeResp { invite_code: code }))
}
