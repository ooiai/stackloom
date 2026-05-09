use super::{
    req::{PageMembersReq, UpdateMemberStatusReq},
    resp::{InviteCodeResp, PaginateMembersResp, TenantMemberResp},
};
use crate::web::WebHttpState;
use common::core::constants::{CACHE_INVITE_CODE, CACHE_INVITE_CODE_LOOKUP};
use domain_base::PageTenantMemberCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::AppResult,
    tracing,
    uuid::Uuid,
};

/// List members of the current tenant (paginated).
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
/// Only tenant admins may call this endpoint.
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

    state
        .user_tenant_service
        .update_member_status(req.member_id, auth_user.uid, auth_user.tid, req.status)
        .await?;

    Ok(Json(()))
}

/// Get or generate an invite code for the current tenant.
///
/// Invite codes are cached in Redis with a 7-day TTL.
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
    if let Err(e) = state.redis_pool.setex(&lookup_key, &tid_str, INVITE_TTL).await {
        tracing::warn!(tenant_id = %auth_user.tid, error = %e, "invite_code: failed to cache invite code lookup");
    }

    Ok(Json(InviteCodeResp { invite_code: code }))
}
