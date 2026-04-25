use super::{
    req::{CreateUserReq, DeleteUserReq, GetUserReq, PageUserReq, UpdateUserReq},
    resp::{PaginateUserResp, UserResp},
};
use crate::base::BaseHttpState;
use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd};
use neocrates::{
    axum::{Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    response::error::{AppError, AppResult},
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
/// - `path`: `POST /base/user/create`
/// - `summary`: `create` handler
/// - `response 200`: `JSON`
pub async fn create(
    State(state): State<UsersState>,
    // Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<CreateUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateUserCmd = req.into();
    state.user_service.create(cmd).await?;

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
    // Extension(_auth_user): Extension<AuthModel>,
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
/// - `path`: `POST /base/user/page`
/// - `summary`: `page` handler
/// - `response 200`: `JSON`
pub async fn page(
    State(state): State<UsersState>,
    // Extension(_auth_user): Extension<AuthModel>,
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
/// - `path`: `POST /base/user/update`
/// - `summary`: `update` handler
/// - `response 200`: `JSON`
pub async fn update(
    State(state): State<UsersState>,
    // Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<UpdateUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let cmd: UpdateUserCmd = req.into();
    state.user_service.update(id, cmd).await?;

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
/// - `path`: `POST /base/user/remove`
/// - `summary`: `delete` handler
/// - `response 200`: `JSON`
pub async fn delete(
    State(state): State<UsersState>,
    // Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<DeleteUserReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete User Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    state.user_service.delete(req.ids).await?;

    Ok(Json(()))
}
