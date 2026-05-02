use super::{
    req::{CreateUserReq, DeleteUserReq, GetUserReq, PageUserReq, UpdateUserReq},
    resp::{PaginateUserResp, UserResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::RequestTraceContext,
    response::error::{AppError, AppResult},
    serde_json::json,
    tracing,
};
use validator::Validate;

pub type UsersState = BaseHttpState;

/// Create a new user.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
///
/// OpenAPI
/// - `operationId`: `ApiHttpBaseUsersCreate`
/// - `path`: `POST /base/users/create`
/// - `summary`: `create` handler
/// - `response 200`: `JSON`
pub async fn create(
    State(state): State<UsersState>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateUserCmd = req.into();
    let user = state.user_service.create(cmd).await?;
    let user_id = user.id;
    let snapshot = logging::serialize_snapshot(UserResp::from(user));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "users",
        "user",
        Some(user_id),
        user_id.to_string(),
        "create",
        "create user".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Get a user by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<UserResp>>` - The user response.
pub async fn get(
    State(state): State<UsersState>,
    DetailedJson(req): DetailedJson<GetUserReq>,
) -> AppResult<Json<UserResp>> {
    tracing::info!("...Get User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let user = state.user_service.get(req.id).await?;
    let resp: UserResp = user.into();

    Ok(Json(resp))
}

/// Page users.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateUserResp>>` - The result of the operation.
///
/// OpenAPI
/// - `operationId`: `ApiHttpBaseUsersPage`
/// - `path`: `POST /base/users/page`
/// - `summary`: `page` handler
/// - `response 200`: `JSON`
pub async fn page(
    State(state): State<UsersState>,
    DetailedJson(req): DetailedJson<PageUserReq>,
) -> AppResult<Json<PaginateUserResp>> {
    tracing::info!("...Paginate User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageUserCmd = req.into();
    let (users, total) = state.user_service.page(cmd).await?;

    let items = users.into_iter().map(UserResp::from).collect::<Vec<_>>();
    let resp = PaginateUserResp::new(items, total as usize);

    Ok(Json(resp))
}

/// Update an existing user.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
///
/// OpenAPI
/// - `operationId`: `ApiHttpBaseUsersUpdate`
/// - `path`: `POST /base/users/update`
/// - `summary`: `update` handler
/// - `response 200`: `JSON`
pub async fn update(
    State(state): State<UsersState>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(UserResp::from(state.user_service.get(id).await?));
    let cmd: UpdateUserCmd = req.into();
    let user = state.user_service.update(id, cmd).await?;
    let after_snapshot = logging::serialize_snapshot(UserResp::from(user));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "users",
        "user",
        Some(id),
        id.to_string(),
        "update",
        "update user".to_string(),
        Some(before_snapshot),
        Some(after_snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Delete users.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
///
/// OpenAPI
/// - `operationId`: `ApiHttpBaseUsersDelete`
/// - `path`: `POST /base/users/remove`
/// - `summary`: `delete` handler
/// - `response 200`: `JSON`
pub async fn delete(
    State(state): State<UsersState>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<DeleteUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ids = req.ids.clone();
    let before_snapshot = if ids.len() == 1 {
        Some(logging::serialize_snapshot(UserResp::from(
            state.user_service.get(ids[0]).await?,
        )))
    } else {
        Some(json!({ "ids": ids.clone() }))
    };
    state.user_service.delete(ids.clone()).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "users",
        "user",
        (ids.len() == 1).then_some(ids[0]),
        ids.iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join(","),
        "delete",
        "delete user".to_string(),
        before_snapshot,
        Some(json!({ "ids": ids })),
    )
    .await;

    Ok(Json(()))
}
