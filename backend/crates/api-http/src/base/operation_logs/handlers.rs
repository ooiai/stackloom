use super::{
    req::PageOperationLogReq,
    resp::{OperationLogResp, PaginateOperationLogResp},
};
use crate::base::BaseHttpState;
use domain_web::PageOperationLogCmd;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub async fn page(
    State(state): State<BaseHttpState>,
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
