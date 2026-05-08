use crate::shared::{
    SharedHttpState,
    common::{
        req::TreeByCodeReq,
        resp::{HeaderContextResp, HeaderContextUserResp, MenuTreeNodeResp, MenuTreeResp},
    },
};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

/// Load the current authenticated header context.
///
/// # Arguments
/// * `state` - The shared HTTP state.
/// * `auth_user` - The authenticated user whose current role ids drive the menu and permission codes.
///
/// # Returns
/// * `AppResult<Json<HeaderContextResp>>` - Compact user info plus aggregated menu and permission codes.
pub async fn header_context(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<HeaderContextResp>> {
    tracing::info!(
        "...Shared Header Context Req: uid={}, role_ids={:?}...",
        auth_user.uid,
        auth_user.rids
    );

    let user = state.user_service.get(auth_user.uid).await?;
    let menu_codes = state
        .role_code_service
        .aggregate_menu_codes(&auth_user.rids)
        .await?;
    let perm_codes = state
        .role_code_service
        .aggregate_perm_codes(&auth_user.rids)
        .await?;

    Ok(Json(HeaderContextResp {
        user: HeaderContextUserResp {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            tenant_name: auth_user.tname,
        },
        menu_codes,
        perm_codes,
    }))
}

/// Load the current user's visible menu subtree rooted at the given code.
///
/// # Arguments
/// * `state` - The shared HTTP state.
/// * `auth_user` - The authenticated user whose role ids determine visibility.
/// * `req` - The request body containing the root code and optional status filter.
///
/// # Returns
/// * `AppResult<Json<MenuTreeResp>>` - The current user's visible subtree response.
pub async fn tree_by_code(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreeByCodeReq>,
) -> AppResult<Json<MenuTreeResp>> {
    tracing::info!(
        "...Shared Common Tree By Code Req: code={}, uid={}, role_ids={:?}...",
        req.code,
        auth_user.uid,
        auth_user.rids
    );

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd = req.into_cmd(auth_user.rids.clone());
    let menus = state.menu_service.tree_by_code(cmd).await?;
    Ok(Json(MenuTreeResp::new(MenuTreeNodeResp::from_flat(menus))))
}
