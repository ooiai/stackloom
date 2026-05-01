use super::{
    req::{
        CreatePermReq,
        DeletePermReq,
        GetPermReq,
        PagePermReq,
        UpdatePermReq,
    },
    resp::{PermResp, PaginatePermResp},
};
use crate::base::BaseHttpState;
use domain_base::{CreatePermCmd, PagePermCmd, UpdatePermCmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type PermsState = BaseHttpState;

/// Create a new perm.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<PermsState>,
    DetailedJson(req): DetailedJson<CreatePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreatePermCmd = req.into();
    state.perm_service.create(cmd).await?;

    Ok(Json(()))
}

/// Get a perm by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PermResp>>` - The perm response.
pub async fn get(
    State(state): State<PermsState>,
    DetailedJson(req): DetailedJson<GetPermReq>,
) -> AppResult<Json<PermResp>> {
    tracing::info!("...Get Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let perm = state.perm_service.get(req.id).await?;
    let resp: PermResp = perm.into();

    Ok(Json(resp))
}

/// Page perms.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginatePermResp>>` - The paginated response.
pub async fn page(
    State(state): State<PermsState>,
    DetailedJson(req): DetailedJson<PagePermReq>,
) -> AppResult<Json<PaginatePermResp>> {
    tracing::info!("...Paginate Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PagePermCmd = req.into();
    let (perms, total) = state.perm_service.page(cmd).await?;

    let items = perms.into_iter().map(PermResp::from).collect::<Vec<_>>();
    let resp = PaginatePermResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Update an existing perm.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<PermsState>,
    DetailedJson(req): DetailedJson<UpdatePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdatePermCmd = req.into();
    state.perm_service.update(id, cmd).await?;

    Ok(Json(()))
}

/// Delete perms.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<PermsState>,
    DetailedJson(req): DetailedJson<DeletePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.perm_service.delete(req.ids).await?;

    Ok(Json(()))
}
