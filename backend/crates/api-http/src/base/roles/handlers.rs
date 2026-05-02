use super::{
    req::{
        ChildrenRoleReq, CreateRoleReq, DeleteRoleReq, GetRoleReq, PageRoleReq,
        RemoveCascadeRoleReq, TreeRoleReq, UpdateRoleReq,
    },
    resp::{PaginateRoleResp, RoleChildrenResp, RoleResp, RoleTreeNodeResp, RoleTreeResp},
};
use crate::base::BaseHttpState;
use domain_base::{
    CreateRoleCmd, PageRoleCmd, UpdateRoleCmd,
    role::{ChildrenRoleCmd, RemoveCascadeRoleCmd, TreeRoleCmd},
};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type RolesState = BaseHttpState;

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

pub async fn get(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<GetRoleReq>,
) -> AppResult<Json<RoleResp>> {
    tracing::info!("...Get Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let role = state.role_service.get(req.id).await?;
    Ok(Json(role.into()))
}

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

    Ok(Json(PaginateRoleResp::new(items, total as usize)))
}

pub async fn tree(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<TreeRoleReq>,
) -> AppResult<Json<RoleTreeResp>> {
    tracing::info!("...Tree Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeRoleCmd = req.into();
    let roles = state.role_service.tree(cmd).await?;
    let items = RoleTreeNodeResp::from_flat(roles);

    Ok(Json(RoleTreeResp::new(items)))
}

pub async fn children(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<ChildrenRoleReq>,
) -> AppResult<Json<RoleChildrenResp>> {
    tracing::info!("...Children Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenRoleCmd = req.into();
    let roles = state.role_service.children(cmd).await?;
    let items = roles.into_iter().map(RoleResp::from).collect::<Vec<_>>();

    Ok(Json(RoleChildrenResp::new(items)))
}

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

pub async fn remove_cascade(
    State(state): State<RolesState>,
    DetailedJson(req): DetailedJson<RemoveCascadeRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: RemoveCascadeRoleCmd = req.into();
    state.role_service.remove_cascade(cmd).await?;

    Ok(Json(()))
}
