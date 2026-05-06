use super::{
    req::{
        AssignUserRolesReq, CreateUserReq, DeleteUserReq, GetUserReq, GetUserRolesReq,
        PageUserReq, UpdateUserReq,
    },
    resp::{PaginateUserResp, UserResp, UserRoleItemResp, UserRolesResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::{RequestTraceContext, models::AuthModel},
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

/// Get all roles visible to the current tenant and which are assigned
/// to the given user's membership.
///
/// The response contains both system roles (`tenant_id = null`) and
/// tenant-scoped roles, each with an `is_assigned` flag.
///
/// # Arguments
/// * `state`     - The base HTTP state.
/// * `auth_user` - The authenticated admin making the request.
/// * `req`       - The request body containing the target `user_id`.
///
/// # Returns
/// * `AppResult<Json<UserRolesResp>>` - The role list with assignment flags.
pub async fn get_roles(
    State(state): State<UsersState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetUserRolesReq>,
) -> AppResult<Json<UserRolesResp>> {
    tracing::info!(
        user_id = %req.user_id,
        tenant_id = %auth_user.tid,
        "get_user_roles"
    );

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    // Load all roles available within this tenant (system + tenant-scoped).
    let all_roles = state.role_service.list_for_tenant(auth_user.tid).await?;

    // Resolve the user's membership to find currently assigned role IDs.
    let assigned_role_ids = match state
        .user_tenant_service
        .find_by_user_and_tenant(req.user_id, auth_user.tid)
        .await?
    {
        Some(membership) => {
            let bindings = state
                .user_tenant_role_service
                .list_by_membership(membership.id)
                .await?;
            bindings.into_iter().map(|b| b.role_id).collect::<std::collections::HashSet<i64>>()
        }
        // User is not a member of this tenant — no roles assigned.
        None => std::collections::HashSet::new(),
    };

    let items = all_roles
        .into_iter()
        .map(|role| UserRoleItemResp {
            is_assigned: assigned_role_ids.contains(&role.id),
            id: role.id,
            tenant_id: role.tenant_id,
            parent_id: role.parent_id,
            code: role.code,
            name: role.name,
            description: role.description,
            is_builtin: role.is_builtin,
            sort: role.sort,
        })
        .collect();

    Ok(Json(UserRolesResp { items }))
}

/// Atomically replace a user's role bindings within the current tenant.
///
/// All submitted `role_ids` are validated against the set of roles that are
/// visible to the current tenant before any write is performed.
///
/// # Arguments
/// * `state`          - The base HTTP state.
/// * `auth_user`      - The authenticated admin making the request.
/// * `trace_context`  - Request trace context for audit logging.
/// * `req`            - The request body: `user_id` + new `role_ids[]`.
///
/// # Returns
/// * `AppResult<Json<()>>` - `Ok(())` on success.
pub async fn assign_roles(
    State(state): State<UsersState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<AssignUserRolesReq>,
) -> AppResult<Json<()>> {
    tracing::info!(
        user_id = %req.user_id,
        tenant_id = %auth_user.tid,
        role_count = %req.role_ids.len(),
        "assign_user_roles"
    );

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    // Deduplicate submitted role IDs.
    let mut role_ids = req.role_ids.clone();
    role_ids.dedup();
    role_ids.sort_unstable();
    role_ids.dedup();

    // Validate every submitted role ID against the allowed set for this tenant.
    let allowed_roles = state.role_service.list_for_tenant(auth_user.tid).await?;
    let allowed_ids: std::collections::HashSet<i64> =
        allowed_roles.iter().map(|r| r.id).collect();

    for &role_id in &role_ids {
        if !allowed_ids.contains(&role_id) {
            tracing::warn!(
                role_id = %role_id,
                tenant_id = %auth_user.tid,
                "assign_user_roles: rejected role_id not visible to tenant"
            );
            return Err(AppError::ValidationError(format!(
                "role_id {role_id} is not allowed for this tenant"
            )));
        }
    }

    // Find the user's membership in this tenant.
    let membership = state
        .user_tenant_service
        .find_by_user_and_tenant(req.user_id, auth_user.tid)
        .await?
        .ok_or_else(|| {
            AppError::not_found_here(format!(
                "user {} has no membership in tenant {}",
                req.user_id, auth_user.tid
            ))
        })?;

    // Capture before-state for audit log.
    let before_bindings = state
        .user_tenant_role_service
        .list_by_membership(membership.id)
        .await?;
    let before_role_ids: Vec<i64> = before_bindings.iter().map(|b| b.role_id).collect();

    // Atomically replace the bindings.
    state
        .user_tenant_role_service
        .replace_by_membership(membership.id, &role_ids)
        .await?;

    // Write audit log.
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "users",
        "user_roles",
        Some(req.user_id),
        req.user_id.to_string(),
        "assign_roles",
        "assign user roles".to_string(),
        Some(json!({ "role_ids": before_role_ids })),
        Some(json!({ "role_ids": role_ids })),
    )
    .await;

    Ok(Json(()))
}
