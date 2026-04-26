use super::{
    req::{
        ChildrenDictReq, CreateDictReq, DeleteDictReq, GetDictReq, PageDictReq,
        RemoveCascadeDictReq, TreeDictReq, UpdateDictReq,
    },
    resp::{DictChildrenResp, DictResp, DictTreeNodeResp, DictTreeResp, PaginateDictResp},
};
use crate::base::BaseHttpState;
use domain_base::{
    ChildrenDictCmd, CreateDictCmd, PageDictCmd, RemoveCascadeDictCmd, TreeDictCmd, UpdateDictCmd,
};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type DictsState = BaseHttpState;

/// Create a new dict.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<CreateDictReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateDictCmd = req.into();
    state.dict_service.create(cmd).await?;

    Ok(Json(()))
}

/// Get a dict by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<DictResp>>` - The dict response.
pub async fn get(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<GetDictReq>,
) -> AppResult<Json<DictResp>> {
    tracing::info!("...Get Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let dict = state.dict_service.get(req.id).await?;
    let resp: DictResp = dict.into();

    Ok(Json(resp))
}

/// Page dicts.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateDictResp>>` - The paginated response.
pub async fn page(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<PageDictReq>,
) -> AppResult<Json<PaginateDictResp>> {
    tracing::info!("...Paginate Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageDictCmd = req.into();
    let (dicts, total) = state.dict_service.page(cmd).await?;

    let items = dicts.into_iter().map(DictResp::from).collect::<Vec<_>>();
    let resp = PaginateDictResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Load the dict tree.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<DictTreeResp>>` - The dict tree response.
pub async fn tree(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<TreeDictReq>,
) -> AppResult<Json<DictTreeResp>> {
    tracing::info!("...Tree Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeDictCmd = req.into();
    let dicts = state.dict_service.tree(cmd).await?;
    let items = DictTreeNodeResp::from_flat(dicts);

    Ok(Json(DictTreeResp::new(items)))
}

/// Load direct dict children by parent.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<DictChildrenResp>>` - The direct child response.
pub async fn children(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<ChildrenDictReq>,
) -> AppResult<Json<DictChildrenResp>> {
    tracing::info!("...Children Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenDictCmd = req.into();
    let dicts = state.dict_service.children(cmd).await?;
    let items = dicts.into_iter().map(DictResp::from).collect::<Vec<_>>();

    Ok(Json(DictChildrenResp::new(items)))
}

/// Update an existing dict.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<UpdateDictReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdateDictCmd = req.into();
    state.dict_service.update(id, cmd).await?;

    Ok(Json(()))
}

/// Delete leaf dicts.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<DeleteDictReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.dict_service.delete(req.ids).await?;

    Ok(Json(()))
}

/// Delete a dict and all descendants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the cascade delete operation.
pub async fn remove_cascade(
    State(state): State<DictsState>,
    DetailedJson(req): DetailedJson<RemoveCascadeDictReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Remove Cascade Dict Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: RemoveCascadeDictCmd = req.into();
    state.dict_service.remove_cascade(cmd).await?;

    Ok(Json(()))
}
