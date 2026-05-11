use crate::shared::{
    SharedHttpState,
    common::{
        req::TreeByCodeReq,
        resp::{HeaderContextResp, MenuTreeNodeResp, MenuTreeResp, MyTenantResp},
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
/// - `state`: The shared HTTP state containing necessary services.
/// - `auth_user`: The authenticated user information extracted from the request context.
///
/// # Returns
/// - `AppResult<Json<HeaderContextResp>>`: The header context response wrapped in a JSON response and application result.
pub async fn header_context(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<HeaderContextResp>> {
    tracing::info!("...Shared Header Context Req: uid={}...", auth_user.uid);

    let context = state
        .shared_context_service
        .get_header_context(auth_user.uid, auth_user.tid)
        .await?;
    Ok(Json(HeaderContextResp::from(context)))
}

/// Load the current user's visible menu subtree rooted at the given code.
///
/// # Arguments
/// - `state`: The shared HTTP state containing necessary services.
/// - `auth_user`: The authenticated user information extracted from the request context.
/// - `req`: The request containing the code for which to load the menu subtree, wrapped in a `DetailedJson` extractor for validation and error handling.
///
/// # Returns
/// - `AppResult<Json<MenuTreeResp>>`: The menu tree response wrapped in a JSON response and application result.
pub async fn tree_by_code(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreeByCodeReq>,
) -> AppResult<Json<MenuTreeResp>> {
    tracing::info!(
        "...Shared Common Tree By Code Req: code={}, uid={}...",
        req.code,
        auth_user.uid
    );

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let context = state
        .shared_context_service
        .get_header_context(auth_user.uid, auth_user.tid)
        .await?;
    let cmd = req.into_cmd(context.role_ids);
    let menus = state.menu_service.tree_by_code(cmd).await?;
    Ok(Json(MenuTreeResp::new(MenuTreeNodeResp::from_flat(menus))))
}

/// Load the list of tenants the current authenticated user belongs to.
///
/// # Arguments
/// - `state`: The shared HTTP state containing necessary services.
/// - `auth_user`: The authenticated user information extracted from the request context.
///
/// # Returns
/// - `AppResult<Json<Vec<MyTenantResp>>>`: A list of tenant responses wrapped in a JSON response and application result.
pub async fn my_tenants(
    State(state): State<SharedHttpState>,
    Extension(auth_user): Extension<AuthModel>,
) -> AppResult<Json<Vec<MyTenantResp>>> {
    tracing::info!(
        "...Shared My Tenants Req: uid={}, tid={}...",
        auth_user.uid,
        auth_user.tid,
    );

    let tenants = state
        .user_tenant_service
        .list_my_tenants(auth_user.uid)
        .await?;

    let resp = tenants
        .into_iter()
        .map(|tenant| MyTenantResp::from_membership(tenant, auth_user.tid))
        .collect();

    Ok(Json(resp))
}
