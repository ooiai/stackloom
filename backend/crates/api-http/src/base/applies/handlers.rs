use super::{
    req::{ApproveTenantApplyReq, BanTenantApplyReq, PageTenantApplyReq, RejectTenantApplyReq},
    resp::{PaginateTenantApplyResp, TenantApplyResp},
};
use crate::base::BaseHttpState;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::{RequestTraceContext, models::AuthModel},
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

pub type TenantApplyState = BaseHttpState;

/// The Tenant apply page handler function that processes incoming HTTP requests to retrieve a paginated list of tenant applications based on the provided query parameters. This function validates the request payload, interacts with the tenant application service to fetch the relevant data, and returns the results in a structured JSON format.
///
/// # Arguments
/// * `state` - The shared auth HTTP state.
/// * `auth_user` - The authenticated user information extracted from the request context.
/// * `trace_context` - The request trace context for logging purposes.
/// * `req` - The request payload containing the pagination and filtering parameters for tenant applications, wrapped in a `DetailedJson` extractor for validation and deserialization.
///
/// # Returns
/// * `AppResult<Json<PaginateTenantApplyResp>>` - A result containing the paginated tenant application response wrapped in a JSON format, or an error if the operation fails.
pub async fn page(
    State(state): State<TenantApplyState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<PageTenantApplyReq>,
) -> AppResult<Json<PaginateTenantApplyResp>> {
    tracing::info!("...Page TenantApply Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd = req.into();
    let (views, total) = state.tenant_apply_service.page(cmd).await?;
    let items: Vec<TenantApplyResp> = views.into_iter().map(Into::into).collect();
    Ok(Json(PaginateTenantApplyResp::new(items, total)))
}

/// The `approve` function is an asynchronous handler for processing tenant application approval requests. It validates the incoming request, interacts with the tenant application service to approve the application, and returns a JSON response indicating the success of the operation.
///
/// # Arguments
/// * `state` - The shared auth HTTP state containing the tenant application service.
/// * `auth_user` - The authenticated user information extracted from the request context, used for authorization and logging purposes.
/// * `trace_context` - The request trace context for logging and debugging purposes.
/// * `req` - The request payload containing the necessary information to approve a tenant application, wrapped in a `DetailedJson` extractor for validation and deserialization.
///
/// # Returns
/// * `AppResult<Json<()>>` - A result indicating the success of the approval operation, returning an empty JSON object on success or an error if the operation fails.
pub async fn approve(
    State(state): State<TenantApplyState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<ApproveTenantApplyReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Approve TenantApply Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.tenant_apply_service.approve(req.into()).await?;
    Ok(Json(()))
}

/// The `reject` function is an asynchronous handler for processing tenant application rejection requests. It validates the incoming request, interacts with the tenant application service to reject the application, and returns a JSON response indicating the success of the operation.
///
/// # Arguments
/// * `state` - The shared auth HTTP state containing the tenant application service.
/// * `auth_user` - The authenticated user information extracted from the request context, used ffor authorization and logging purposes.
/// * `trace_context` - The request trace context for logging and debugging purposes.
/// * `req` - The request payload containing the necessary information to reject a tenant application, wrapped in a `DetailedJson` extractor for validation and deserialization.
///
/// # Returns
/// * `AppResult<Json<()>>` - A result indicating the success of the rejection operation, returning an empty JSON object on success or an error if the operation fails.
pub async fn reject(
    State(state): State<TenantApplyState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<RejectTenantApplyReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Reject TenantApply Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.tenant_apply_service.reject(req.into()).await?;
    Ok(Json(()))
}

/// The `ban` function is an asynchronous handler for processing tenant application ban requests. It validates the incoming request, interacts with the tenant application service to ban the application, and returns a JSON response indicating the success of the operation.
///
/// # Arguments
/// * `state` - The shared auth HTTP state containing the tenant application service.
/// * `auth_user` - The authenticated user information extracted from the request context, used for authorization and logging purposes.
/// * `trace_context` - The request trace context for logging and debugging purposes.
/// * `req` - The request payload containing the necessary information to ban a tenant application, wrapped in a `DetailedJson` extractor for validation and deserialization.
///
/// # Returns
/// * `AppResult<Json<()>>` - A result indicating the success of the ban operation, returning an empty JSON object on success or an error if the operation fails.
pub async fn ban(
    State(state): State<TenantApplyState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(_trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<BanTenantApplyReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Ban TenantApply Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.tenant_apply_service.ban(req.into()).await?;
    Ok(Json(()))
}
