use super::{
    req::PageSystemLogReq,
    resp::{PaginateSystemLogResp, SystemLogResp},
};
use crate::base::BaseHttpState;
use domain_system::PageSystemLogCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::models::AuthModel,
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

/// Page system logs.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateSystemLogResp>>` - The paginated response.
pub async fn page(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
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
