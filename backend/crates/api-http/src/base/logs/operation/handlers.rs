use super::{
    req::PageOperationLogReq,
    resp::{OperationLogResp, PaginateOperationLogResp},
};
use crate::base::BaseHttpState;
use domain_base::PageOperationLogCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

/// Page operation logs.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateOperationLogResp>>` - The paginated response.
pub async fn page(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageOperationLogReq>,
) -> AppResult<Json<PaginateOperationLogResp>> {
    tracing::info!("...Paginate Operation Log Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: PageOperationLogCmd = req.into();
    let (items, total) = state.operation_log_service.page(cmd).await?;
    let items = items.into_iter().map(OperationLogResp::from).collect();

    Ok(Json(PaginateOperationLogResp::new(items, total as usize)))
}
