use super::{
    req::StatsQueryReq,
    resp::{StatsBehaviorResp, StatsFunnelResp, StatsGrowthResp, StatsOverviewResp, StatsRetentionResp},
};
use crate::base::BaseHttpState;
use domain_base::StatsQueryCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    middlewares::{RequestTraceContext, models::AuthModel},
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type StatsState = BaseHttpState;

/// Get the stats overview including KPI cards and recent activity trends.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body containing the time range in days.
///
/// # Returns
/// * `AppResult<Json<StatsOverviewResp>>` - KPI metrics and trend series for the requested period.
pub async fn overview(
    State(state): State<StatsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    Json(req): Json<StatsQueryReq>,
) -> AppResult<Json<StatsOverviewResp>> {
    tracing::info!("...Stats Overview Req: days={:?}...", req.days);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = StatsQueryCmd { days: req.effective_days() };
    let view = state.stats_service.get_overview(cmd).await?;
    Ok(Json(view.into()))
}

/// Get user growth data including daily new registrations and cumulative trends.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body containing the time range in days.
///
/// # Returns
/// * `AppResult<Json<StatsGrowthResp>>` - Daily and cumulative registration counts for the requested period.
pub async fn growth(
    State(state): State<StatsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    Json(req): Json<StatsQueryReq>,
) -> AppResult<Json<StatsGrowthResp>> {
    tracing::info!("...Stats Growth Req: days={:?}...", req.days);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = StatsQueryCmd { days: req.effective_days() };
    let view = state.stats_service.get_growth(cmd).await?;
    Ok(Json(view.into()))
}

/// Get cohort retention analysis (D1/D7/D30) based on login events.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body containing the time range in days.
///
/// # Returns
/// * `AppResult<Json<StatsRetentionResp>>` - Weekly cohort retention rates for the requested period.
pub async fn retention(
    State(state): State<StatsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    Json(req): Json<StatsQueryReq>,
) -> AppResult<Json<StatsRetentionResp>> {
    tracing::info!("...Stats Retention Req: days={:?}...", req.days);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = StatsQueryCmd { days: req.effective_days() };
    let view = state.stats_service.get_retention(cmd).await?;
    Ok(Json(view.into()))
}

/// Get behavioral analytics including per-module operation counts and daily trends.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body containing the time range in days.
///
/// # Returns
/// * `AppResult<Json<StatsBehaviorResp>>` - Module-level operation counts and trend series for the requested period.
pub async fn behavior(
    State(state): State<StatsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    Json(req): Json<StatsQueryReq>,
) -> AppResult<Json<StatsBehaviorResp>> {
    tracing::info!("...Stats Behavior Req: days={:?}...", req.days);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = StatsQueryCmd { days: req.effective_days() };
    let view = state.stats_service.get_behavior(cmd).await?;
    Ok(Json(view.into()))
}

/// Get the conversion funnel from registration through login, action, and activation.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `_req` - The request body (unused; funnel is computed across all time).
///
/// # Returns
/// * `AppResult<Json<StatsFunnelResp>>` - Funnel step counts across the full data history.
pub async fn funnel(
    State(state): State<StatsState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    Json(_req): Json<StatsQueryReq>,
) -> AppResult<Json<StatsFunnelResp>> {
    tracing::info!("...Stats Funnel Req...");

    let view = state.stats_service.get_funnel().await?;
    Ok(Json(view.into()))
}
