use super::{
    req::PageAuditLogReq,
    resp::{AuditLogResp, PaginateAuditLogResp},
};
use crate::system::SysHttpState;
use domain_system::PageAuditLogCmd;
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub async fn page(
    State(state): State<SysHttpState>,
    DetailedJson(req): DetailedJson<PageAuditLogReq>,
) -> AppResult<Json<PaginateAuditLogResp>> {
    tracing::info!("...Paginate Audit Log Req: {:?}...", req);

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: PageAuditLogCmd = req.into();
    let (items, total) = state.audit_log_service.page(cmd).await?;
    let items = items.into_iter().map(AuditLogResp::from).collect();

    Ok(Json(PaginateAuditLogResp::new(items, total as usize)))
}
