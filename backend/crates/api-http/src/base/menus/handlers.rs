use super::{
    req::{
        CreateMenuReq,
        DeleteMenuReq,
        GetMenuReq,
        PageMenuReq,
        UpdateMenuReq,
    },
    resp::{MenuResp, PaginateMenuResp},
};
use crate::base::BaseHttpState;
use domain_base::{CreateMenuCmd, PageMenuCmd, UpdateMenuCmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
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
    DetailedJson(req): DetailedJson<CreateMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateMenuCmd = req.into();
    state.menu_service.create(cmd).await?;

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
    DetailedJson(req): DetailedJson<UpdateMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdateMenuCmd = req.into();
    state.menu_service.update(id, cmd).await?;

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
    DetailedJson(req): DetailedJson<DeleteMenuReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Menu Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.menu_service.delete(req.ids).await?;

    Ok(Json(()))
}
