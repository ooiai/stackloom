use super::{
    req::{
        ChildrenMenuReq, CreateMenuReq, DeleteMenuReq, GetMenuReq, PageMenuReq,
        RemoveCascadeMenuReq, TreeByCodeMenuReq, TreeMenuReq, UpdateMenuReq,
    },
    resp::{MenuChildrenResp, MenuResp, MenuTreeNodeResp, MenuTreeResp, PaginateMenuResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{
    CreateMenuCmd, PageMenuCmd, UpdateMenuCmd,
    menu::{ChildrenMenuCmd, RemoveCascadeMenuCmd, TreeByCodeMenuCmd, TreeMenuCmd},
};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::{RequestTraceContext, models::AuthModel},
    response::error::{AppError, AppResult},
    serde_json::json,
    tracing,
};
use validator::Validate;

pub type MenusState = BaseHttpState;

/// Create a new menu.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateMenuCmd = req.into();
    let menu = state.menu_service.create(cmd).await?;
    let menu_id = menu.id;
    let snapshot = logging::serialize_snapshot(MenuResp::from(menu));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "menus",
        "menu",
        Some(menu_id),
        menu_id.to_string(),
        "create",
        "create menu".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Get a menu by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<MenuResp>>` - The menu response.
pub async fn get(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetMenuReq>,
) -> AppResult<Json<MenuResp>> {
    tracing::info!("...Get Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let menu = state.menu_service.get(req.id).await?;
    let resp: MenuResp = menu.into();

    Ok(Json(resp))
}

/// Page menus.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateMenuResp>>` - The paginated response.
pub async fn page(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageMenuReq>,
) -> AppResult<Json<PaginateMenuResp>> {
    tracing::info!("...Paginate Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageMenuCmd = req.into();
    let (menus, total) = state.menu_service.page(cmd).await?;

    let items = menus.into_iter().map(MenuResp::from).collect::<Vec<_>>();
    let resp = PaginateMenuResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Load the menu tree.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<MenuTreeResp>>` - The menu tree response.
pub async fn tree(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreeMenuReq>,
) -> AppResult<Json<MenuTreeResp>> {
    tracing::info!("...Tree Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeMenuCmd = req.into();
    let menus = state.menu_service.tree(cmd).await?;
    let items = MenuTreeNodeResp::from_flat(menus);

    Ok(Json(MenuTreeResp::new(items)))
}

/// Load the menu subtree rooted at the given code.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body containing the root `code`.
///
/// # Returns
/// * `AppResult<Json<MenuTreeResp>>` - The subtree response.
pub async fn tree_by_code(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreeByCodeMenuReq>,
) -> AppResult<Json<MenuTreeResp>> {
    tracing::info!("...Tree By Code Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeByCodeMenuCmd = req.into();
    let menus = state.menu_service.tree_by_code(cmd).await?;
    let items = MenuTreeNodeResp::from_flat(menus);

    Ok(Json(MenuTreeResp::new(items)))
}

/// Load direct menu children by parent.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<MenuChildrenResp>>` - The direct child response.
pub async fn children(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<ChildrenMenuReq>,
) -> AppResult<Json<MenuChildrenResp>> {
    tracing::info!("...Children Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenMenuCmd = req.into();
    let menus = state.menu_service.children(cmd).await?;
    let items = menus.into_iter().map(MenuResp::from).collect::<Vec<_>>();

    Ok(Json(MenuChildrenResp::new(items)))
}

/// Update an existing menu.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(MenuResp::from(state.menu_service.get(id).await?));
    let cmd: UpdateMenuCmd = req.into();
    let menu = state.menu_service.update(id, cmd).await?;
    let after_snapshot = logging::serialize_snapshot(MenuResp::from(menu));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "menus",
        "menu",
        Some(id),
        id.to_string(),
        "update",
        "update menu".to_string(),
        Some(before_snapshot),
        Some(after_snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Delete menus.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<DeleteMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ids = req.ids.clone();
    let before_snapshot = if ids.len() == 1 {
        Some(logging::serialize_snapshot(MenuResp::from(
            state.menu_service.get(ids[0]).await?,
        )))
    } else {
        Some(json!({ "ids": ids.clone() }))
    };
    state.menu_service.delete(ids.clone()).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "menus",
        "menu",
        (ids.len() == 1).then_some(ids[0]),
        ids.iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join(","),
        "delete",
        "delete menu".to_string(),
        before_snapshot,
        Some(json!({ "ids": ids })),
    )
    .await;

    Ok(Json(()))
}

/// Delete a menu and all descendants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the cascade delete operation.
pub async fn remove_cascade(
    State(state): State<MenusState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<RemoveCascadeMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(MenuResp::from(state.menu_service.get(id).await?));
    let cmd: RemoveCascadeMenuCmd = req.into();
    state.menu_service.remove_cascade(cmd).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "menus",
        "menu",
        Some(id),
        id.to_string(),
        "remove_cascade",
        "remove cascade menu".to_string(),
        Some(before_snapshot),
        Some(json!({ "id": id, "cascade": true })),
    )
    .await;

    Ok(Json(()))
}
