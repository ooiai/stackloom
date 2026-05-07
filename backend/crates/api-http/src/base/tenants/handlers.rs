use super::{
    req::{
        ChildrenTenantReq, CreateTenantReq, DeleteTenantReq, GetTenantReq, PageTenantReq,
        RemoveCascadeTenantReq, TreeTenantReq, UpdateTenantReq,
    },
    resp::{
        PaginateTenantResp, TenantChildrenResp, TenantResp, TenantTreeNodeResp, TenantTreeResp,
    },
};
use crate::base::{BaseHttpState, logging};
use domain_base::{
    CreateTenantCmd, PageTenantCmd, UpdateTenantCmd,
    tenant::{ChildrenTenantCmd, RemoveCascadeTenantCmd, TreeTenantCmd},
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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateTenantCmd = req.into();
    let tenant = state.tenant_service.create(cmd).await?;
    let tenant_id = tenant.id;
    let snapshot = logging::serialize_snapshot(TenantResp::from(tenant));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "tenants",
        "tenant",
        Some(tenant_id),
        tenant_id.to_string(),
        "create",
        "create tenant".to_string(),
        None,
        Some(snapshot),
    )
    .await;

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
    Extension(_auth_user): Extension<AuthModel>,
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
    Extension(_auth_user): Extension<AuthModel>,
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
    Extension(_auth_user): Extension<AuthModel>,
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
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<ChildrenTenantReq>,
) -> AppResult<Json<TenantChildrenResp>> {
    tracing::info!("...Children Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenTenantCmd = req.into();
    let tenants = state.tenant_service.children(cmd).await?;
    let items = tenants
        .into_iter()
        .map(TenantResp::from)
        .collect::<Vec<_>>();

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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(TenantResp::from(state.tenant_service.get(id).await?));
    let cmd: UpdateTenantCmd = req.into();
    let tenant = state.tenant_service.update(id, cmd).await?;
    let after_snapshot = logging::serialize_snapshot(TenantResp::from(tenant));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "tenants",
        "tenant",
        Some(id),
        id.to_string(),
        "update",
        "update tenant".to_string(),
        Some(before_snapshot),
        Some(after_snapshot),
    )
    .await;

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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<DeleteTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ids = req.ids.clone();
    let before_snapshot = if ids.len() == 1 {
        Some(logging::serialize_snapshot(TenantResp::from(
            state.tenant_service.get(ids[0]).await?,
        )))
    } else {
        Some(json!({ "ids": ids.clone() }))
    };
    state.tenant_service.delete(ids.clone()).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "tenants",
        "tenant",
        (ids.len() == 1).then_some(ids[0]),
        ids.iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join(","),
        "delete",
        "delete tenant".to_string(),
        before_snapshot,
        Some(json!({ "ids": ids })),
    )
    .await;

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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<RemoveCascadeTenantReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Tenant Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(TenantResp::from(state.tenant_service.get(id).await?));
    let cmd: RemoveCascadeTenantCmd = req.into();
    state.tenant_service.remove_cascade(cmd).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "tenants",
        "tenant",
        Some(id),
        id.to_string(),
        "remove_cascade",
        "remove cascade tenant".to_string(),
        Some(before_snapshot),
        Some(json!({ "id": id, "cascade": true })),
    )
    .await;

    Ok(Json(()))
}
