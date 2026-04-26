use super::{
    req::{CreateTenantReq, DeleteTenantReq, GetTenantReq, PageTenantReq, UpdateTenantReq},
    resp::{PaginateTenantResp, TenantResp},
};
use crate::base::BaseHttpState;
use domain_base::{CreateTenantCmd, PageTenantCmd, UpdateTenantCmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type TenantsState = BaseHttpState;

/// Create a new tenant.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<CreateTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateTenantCmd = req.into();
    state.tenant_service.create(cmd).await?;

    Ok(Json(()))
}

/// Get a tenant by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<TenantResp>>` - The tenant response.
pub async fn get(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<GetTenantReq>,
) -> AppResult<Json<TenantResp>> {
    tracing::info!("...Get Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let tenant = state.tenant_service.get(req.id).await?;
    let resp: TenantResp = tenant.into();

    Ok(Json(resp))
}

/// Page tenants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateTenantResp>>` - The paginated response.
pub async fn page(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<PageTenantReq>,
) -> AppResult<Json<PaginateTenantResp>> {
    tracing::info!("...Paginate Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageTenantCmd = req.into();
    let (tenants, total) = state.tenant_service.page(cmd).await?;

    let items = tenants
        .into_iter()
        .map(TenantResp::from)
        .collect::<Vec<_>>();
    let resp = PaginateTenantResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Update an existing tenant.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<UpdateTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdateTenantCmd = req.into();
    state.tenant_service.update(id, cmd).await?;

    Ok(Json(()))
}

/// Delete tenants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<DeleteTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.tenant_service.delete(req.ids).await?;

    Ok(Json(()))
}
