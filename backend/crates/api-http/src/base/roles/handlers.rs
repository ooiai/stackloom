use super::{
    req::{
        CreateRoleReq,
        DeleteRoleReq,
        GetRoleReq,
        PageRoleReq,
        UpdateRoleReq,
    },
    resp::{RoleResp, PaginateRoleResp},
};
use crate::base::BaseHttpState;
use domain_base::{CreateRoleCmd, PageRoleCmd, UpdateRoleCmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type RolesState = BaseHttpState;

/// Create a new role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<CreateRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateRoleCmd = req.into();
    state.role_service.create(cmd).await?;

    Ok(Json(()))
}

/// Get a role by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<RoleResp>>` - The role response.
pub async fn get(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<GetRoleReq>,
) -> AppResult<Json<RoleResp>> {
    tracing::info!("...Get Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let role = state.role_service.get(req.id).await?;
    let resp: RoleResp = role.into();

    Ok(Json(resp))
}

/// Page roles.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateRoleResp>>` - The paginated response.
pub async fn page(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<PageRoleReq>,
) -> AppResult<Json<PaginateRoleResp>> {
    tracing::info!("...Paginate Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageRoleCmd = req.into();
    let (roles, total) = state.role_service.page(cmd).await?;

    let items = roles.into_iter().map(RoleResp::from).collect::<Vec<_>>();
    let resp = PaginateRoleResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Update an existing role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<UpdateRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdateRoleCmd = req.into();
    state.role_service.update(id, cmd).await?;

    Ok(Json(()))
}

/// Delete roles.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<DeleteRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.role_service.delete(req.ids).await?;

    Ok(Json(()))
}
