use super::{
    req::{
        ChildrenPermReq, CreatePermReq, DeletePermReq, GetPermReq, PagePermReq,
        RemoveCascadePermReq, TreePermReq, UpdatePermReq,
    },
    resp::{PaginatePermResp, PermChildrenResp, PermResp, PermTreeNodeResp, PermTreeResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{
    CreatePermCmd, PagePermCmd, UpdatePermCmd,
    perm::{ChildrenPermCmd, RemoveCascadePermCmd, TreePermCmd},
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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreatePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreatePermCmd = req.into();
    let perm = state.perm_service.create(cmd).await?;
    let perm_id = perm.id;
    let snapshot = logging::serialize_snapshot(PermResp::from(perm));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "perms",
        "perm",
        Some(perm_id),
        perm_id.to_string(),
        "create",
        "create perm".to_string(),
        None,
        Some(snapshot),
    )
    .await;

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
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetPermReq>,
) -> AppResult<Json<PermResp>> {
    tracing::info!("...Get Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let perm = state.perm_service.get(req.id).await?;
    Ok(Json(perm.into()))
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
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PagePermReq>,
) -> AppResult<Json<PaginatePermResp>> {
    tracing::info!("...Paginate Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PagePermCmd = req.into();
    let (perms, total) = state.perm_service.page(cmd).await?;
    let items = perms.into_iter().map(PermResp::from).collect::<Vec<_>>();

    Ok(Json(PaginatePermResp::new(items, total as usize)))
}

/// Load the perm tree.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PermTreeResp>>` - The perm tree response.
pub async fn tree(
    State(state): State<PermsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreePermReq>,
) -> AppResult<Json<PermTreeResp>> {
    tracing::info!("...Tree Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreePermCmd = req.into();
    let perms = state.perm_service.tree(cmd).await?;
    let items = PermTreeNodeResp::from_flat(perms);

    Ok(Json(PermTreeResp::new(items)))
}

/// Load direct perm children by parent.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PermChildrenResp>>` - The direct child response.
pub async fn children(
    State(state): State<PermsState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<ChildrenPermReq>,
) -> AppResult<Json<PermChildrenResp>> {
    tracing::info!("...Children Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenPermCmd = req.into();
    let perms = state.perm_service.children(cmd).await?;
    let items = perms.into_iter().map(PermResp::from).collect::<Vec<_>>();

    Ok(Json(PermChildrenResp::new(items)))
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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdatePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(PermResp::from(state.perm_service.get(id).await?));
    let cmd: UpdatePermCmd = req.into();
    let perm = state.perm_service.update(id, cmd).await?;
    let after_snapshot = logging::serialize_snapshot(PermResp::from(perm));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "perms",
        "perm",
        Some(id),
        id.to_string(),
        "update",
        "update perm".to_string(),
        Some(before_snapshot),
        Some(after_snapshot),
    )
    .await;

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
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<DeletePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ids = req.ids.clone();
    let before_snapshot = if ids.len() == 1 {
        Some(logging::serialize_snapshot(PermResp::from(
            state.perm_service.get(ids[0]).await?,
        )))
    } else {
        Some(json!({ "ids": ids.clone() }))
    };
    state.perm_service.delete(ids.clone()).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "perms",
        "perm",
        (ids.len() == 1).then_some(ids[0]),
        ids.iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join(","),
        "delete",
        "delete perm".to_string(),
        before_snapshot,
        Some(json!({ "ids": ids })),
    )
    .await;

    Ok(Json(()))
}

/// Delete a perm and all descendants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the cascade delete operation.
pub async fn remove_cascade(
    State(state): State<PermsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<RemoveCascadePermReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Perm Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(PermResp::from(state.perm_service.get(id).await?));
    let cmd: RemoveCascadePermCmd = req.into();
    state.perm_service.remove_cascade(cmd).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "perms",
        "perm",
        Some(id),
        id.to_string(),
        "remove_cascade",
        "remove cascade perm".to_string(),
        Some(before_snapshot),
        Some(json!({ "id": id, "cascade": true })),
    )
    .await;

    Ok(Json(()))
}
