use super::{
    req::PageSystemLogReq,
    resp::{PaginateSystemLogResp, SystemLogResp},
};
use crate::system::SysHttpState;
use domain_system::PageSystemLogCmd;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub async fn page(
    State(state): State<SysHttpState>,
    DetailedJson(req): DetailedJson<PageSystemLogReq>,
) -> AppResult<Json<PaginateSystemLogResp>> {
    tracing::info!("...Paginate System Log Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: PageSystemLogCmd = req.into();
    let (items, total) = state.system_log_service.page(cmd).await?;
    let items = items.into_iter().map(SystemLogResp::from).collect();

    Ok(Json(PaginateSystemLogResp::new(items, total as usize)))
}
