use super::{
    req::PageMembersReq,
    resp::{PaginateMembersResp, TenantMemberResp},
};
use crate::web::WebHttpState;
use domain_base::PageTenantMemberCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::AppResult,
    tracing,
};

/// List members of the current tenant (paginated).
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `auth_user` - The authenticated user.
/// * `req` - The request containing pagination and filtering parameters.
///
/// # Returns
/// * `AppResult<Json<PaginateMembersResp>>` - A paginated list of tenant members or an error.
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
