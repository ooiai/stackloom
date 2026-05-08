use super::{
    req::{
        AssignRoleMenusReq, AssignRolePermsReq, ChildrenRoleReq, CreateRoleReq, DeleteRoleReq,
        GetRoleMenusReq, GetRolePermsReq, GetRoleReq, PageRoleReq, RemoveCascadeRoleReq,
        TreeRoleReq, UpdateRoleReq,
    },
    resp::{PaginateRoleResp, RoleChildrenResp, RoleResp, RoleTreeNodeResp, RoleTreeResp},
};
use crate::base::{BaseHttpState, logging};
use domain_base::{
    CreateRoleCmd, PageRoleCmd, UpdateRoleCmd,
    role::{
        AssignRoleMenusCmd, AssignRolePermsCmd, ChildrenRoleCmd, RemoveCascadeRoleCmd, TreeRoleCmd,
    },
};
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::{axum_extractor::DetailedJson, hashid},
    middlewares::{
        RequestTraceContext,
        models::{AuthModel, CACHE_MENUS_RID, CACHE_PERMS_RID},
    },
    response::error::{AppError, AppResult},
    serde_json::json,
    tracing,
};
use validator::Validate;

pub type RolesState = BaseHttpState;

/// Create a new role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn create(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Create Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: CreateRoleCmd = req.into();
    let role = state.role_service.create(cmd).await?;
    let role_id = role.id;
    let snapshot = logging::serialize_snapshot(RoleResp::from(role));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        Some(role_id),
        role_id.to_string(),
        "create",
        "create role".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Get a role by id.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<RoleResp>>` - The role response.
pub async fn get(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetRoleReq>,
) -> AppResult<Json<RoleResp>> {
    tracing::info!("...Get Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let role = state.role_service.get(req.id).await?;
    Ok(Json(role.into()))
}

/// Page roles.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<PaginateRoleResp>>` - The paginated response.
pub async fn page(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageRoleReq>,
) -> AppResult<Json<PaginateRoleResp>> {
    tracing::info!("...Paginate Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: PageRoleCmd = req.into();
    let (roles, total) = state.role_service.page(cmd).await?;
    let items = roles.into_iter().map(RoleResp::from).collect::<Vec<_>>();

    Ok(Json(PaginateRoleResp::new(items, total as usize)))
}

/// Load the role tree.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<RoleTreeResp>>` - The role tree response.
pub async fn tree(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<TreeRoleReq>,
) -> AppResult<Json<RoleTreeResp>> {
    tracing::info!("...Tree Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: TreeRoleCmd = req.into();
    let roles = state.role_service.tree(cmd).await?;
    let items = RoleTreeNodeResp::from_flat(roles);

    Ok(Json(RoleTreeResp::new(items)))
}

/// Load direct role children by parent.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<RoleChildrenResp>>` - The direct child response.
pub async fn children(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<ChildrenRoleReq>,
) -> AppResult<Json<RoleChildrenResp>> {
    tracing::info!("...Children Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let cmd: ChildrenRoleCmd = req.into();
    let roles = state.role_service.children(cmd).await?;
    let items = roles.into_iter().map(RoleResp::from).collect::<Vec<_>>();

    Ok(Json(RoleChildrenResp::new(items)))
}

/// Update an existing role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - Update request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn update(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Update Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(RoleResp::from(state.role_service.get(id).await?));
    let cmd: UpdateRoleCmd = req.into();
    let role = state.role_service.update(id, cmd).await?;
    let after_snapshot = logging::serialize_snapshot(RoleResp::from(role));
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        Some(id),
        id.to_string(),
        "update",
        "update role".to_string(),
        Some(before_snapshot),
        Some(after_snapshot),
    )
    .await;

    Ok(Json(()))
}

/// Delete roles.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn delete(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<DeleteRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Delete Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let ids = req.ids.clone();
    let before_snapshot = if ids.len() == 1 {
        Some(logging::serialize_snapshot(RoleResp::from(
            state.role_service.get(ids[0]).await?,
        )))
    } else {
        Some(json!({ "ids": ids.clone() }))
    };
    state.role_service.delete(ids.clone()).await?;
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        (ids.len() == 1).then_some(ids[0]),
        ids.iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join(","),
        "delete",
        "delete role".to_string(),
        before_snapshot,
        Some(json!({ "ids": ids })),
    )
    .await;

    Ok(Json(()))
}

/// Delete a role and all descendants.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the cascade delete operation.
pub async fn remove_cascade(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<RemoveCascadeRoleReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...RemoveCascade Role Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let id = req.id;
    let before_snapshot =
        logging::serialize_snapshot(RoleResp::from(state.role_service.get(id).await?));
    let cmd: RemoveCascadeRoleCmd = req.into();
    state.role_service.remove_cascade(cmd).await?;

    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        Some(id),
        id.to_string(),
        "remove_cascade",
        "cascade remove role".to_string(),
        Some(before_snapshot),
        None,
    )
    .await;

    Ok(Json(()))
}

/// Get the list of menus assigned to a role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body containing the `role_id`.
///
/// # Returns
/// * `AppResult<Json<Value>>` - JSON object with `items` array of encoded menu IDs.
pub async fn get_menus(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetRoleMenusReq>,
) -> AppResult<Json<neocrates::serde_json::Value>> {
    tracing::info!("...Get Role Menus Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let menu_ids = state.role_service.get_role_menus(req.role_id).await?;
    let resp = neocrates::serde_json::json!({
        "items": menu_ids.into_iter().map(|id| hashid::encode_i64(id)).collect::<Vec<_>>()
    });
    Ok(Json(resp))
}

/// Assign menus to a role (replaces the current assignment).
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body containing `role_id` and menu ID list.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn assign_menus(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<AssignRoleMenusReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Assign Role Menus Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let role_id = req.role_id;
    let cmd: AssignRoleMenusCmd = req.into();
    state.role_service.assign_menus(cmd).await?;

    match state.role_service.get_role_menu_codes(role_id).await {
        Ok(codes) => {
            if let Ok(json) = neocrates::serde_json::to_string(&codes) {
                if let Err(e) = state
                    .redis_pool
                    .set(
                        format!("{}{}{}", state.cfg.server.prefix, CACHE_MENUS_RID, role_id),
                        json,
                    )
                    .await
                {
                    tracing::warn!(role_id = %role_id, error = %e, "assign_menus: failed to update menu cache");
                }
            }
        }
        Err(e) => {
            tracing::warn!(role_id = %role_id, error = %e, "assign_menus: failed to query menu codes for cache");
        }
    }

    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        Some(role_id),
        role_id.to_string(),
        "assign_menus",
        "assign menus to role".to_string(),
        None,
        None,
    )
    .await;

    Ok(Json(()))
}

/// Get the list of perms assigned to a role.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body containing the `role_id`.
///
/// # Returns
/// * `AppResult<Json<Value>>` - JSON object with `items` array of encoded perm IDs.
pub async fn get_perms(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<GetRolePermsReq>,
) -> AppResult<Json<neocrates::serde_json::Value>> {
    tracing::info!("...Get Role Perms Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let perm_ids = state.role_service.get_role_perms(req.role_id).await?;
    let resp = neocrates::serde_json::json!({
        "items": perm_ids.into_iter().map(|id| hashid::encode_i64(id)).collect::<Vec<_>>()
    });
    Ok(Json(resp))
}

/// Assign perms to a role (replaces the current assignment).
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `req` - The request body containing `role_id` and perm ID list.
///
/// # Returns
/// * `AppResult<Json<()>>` - The result of the operation.
pub async fn assign_perms(
    State(state): State<RolesState>,
    Extension(_auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<AssignRolePermsReq>,
) -> AppResult<Json<()>> {
    tracing::info!("...Assign Role Perms Req: {:?}...", req);

    req.validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))?;

    let role_id = req.role_id;
    let cmd: AssignRolePermsCmd = req.into();
    state.role_service.assign_perms(cmd).await?;

    match state.role_service.get_role_perm_codes(role_id).await {
        Ok(codes) => {
            if let Ok(json) = neocrates::serde_json::to_string(&codes) {
                if let Err(e) = state
                    .redis_pool
                    .set(
                        format!("{}{}{}", state.cfg.server.prefix, CACHE_PERMS_RID, role_id),
                        json,
                    )
                    .await
                {
                    tracing::warn!(role_id = %role_id, error = %e, "assign_perms: failed to update perm cache");
                }
            }
        }
        Err(e) => {
            tracing::warn!(role_id = %role_id, error = %e, "assign_perms: failed to query perm codes for cache");
        }
    }

    logging::write_mutation_logs(
        &state,
        &trace_context,
        "roles",
        "role",
        Some(role_id),
        role_id.to_string(),
        "assign_perms",
        "assign perms to role".to_string(),
        None,
        None,
    )
    .await;

    Ok(Json(()))
}
