use super::{
    req::{
        ChildrenTenantReq, CreateTenantReq, DeleteTenantReq, GetTenantReq, PageTenantReq,
        RemoveCascadeTenantReq, TreeTenantReq, UpdateTenantReq,
    },
    resp::{
        PaginateTenantResp, TenantChildrenResp, TenantResp, TenantTreeNodeResp, TenantTreeResp,
    },
};
use crate::base::BaseHttpState;
use domain_base::{
    CreateTenantCmd, PageTenantCmd, UpdateTenantCmd,
    tenant::{ChildrenTenantCmd, RemoveCascadeTenantCmd, TreeTenantCmd},
};
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

/// Load the tenant tree.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<TenantTreeResp>>` - The tenant tree response.
pub async fn tree(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<TreeTenantReq>,
) -> AppResult<Json<TenantTreeResp>> {
    tracing::info!("...Tree Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeTenantCmd = req.into();
    let tenants = state.tenant_service.tree(cmd).await?;
    let items = TenantTreeNodeResp::from_flat(tenants);

    Ok(Json(TenantTreeResp::new(items)))
}

/// Load direct tenant children by parent.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<TenantChildrenResp>>` - The direct child response.
pub async fn children(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<ChildrenTenantReq>,
) -> AppResult<Json<TenantChildrenResp>> {
    tracing::info!("...Children Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenTenantCmd = req.into();
    let tenants = state.tenant_service.children(cmd).await?;
    let items = tenants.into_iter().map(TenantResp::from).collect::<Vec<_>>();

    Ok(Json(TenantChildrenResp::new(items)))
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

/// Delete a tenant and all descendants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the cascade delete operation.
pub async fn remove_cascade(
    State(state): State<TenantsState>,
    DetailedJson(req): DetailedJson<RemoveCascadeTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: RemoveCascadeTenantCmd = req.into();
    state.tenant_service.remove_cascade(cmd).await?;

    Ok(Json(()))
}
