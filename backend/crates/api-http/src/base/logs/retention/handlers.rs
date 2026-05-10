use super::req::{GetLogRetentionPolicyReq, UpdateLogRetentionPolicyReq};
use super::resp::LogRetentionPolicyResp;
use crate::base::BaseHttpState;
use axum::Extension;
use domain_base::LogRetentionPolicy;
use neocrates::middlewares::models::AuthModel;
use neocrates::{
    axum::{Json, extract::State},
    response::error::{AppError, AppResult},
};

/// Get log retention policy for a specific log type.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<LogRetentionPolicyResp>>` - The log retention policy response.
pub async fn get_policy(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    Json(req): Json<GetLogRetentionPolicyReq>,
) -> AppResult<Json<LogRetentionPolicyResp>> {
    let repo = state.log_retention_repo.clone();
    let policy = repo.get(&req.log_type).await?;

    let policy = policy.unwrap_or_else(|| LogRetentionPolicy {
        id: 0,
        log_type: req.log_type.clone(),
        retention_days: None,
        last_cleanup_at: None,
    });

    Ok(Json(LogRetentionPolicyResp {
        log_type: policy.log_type,
        retention_days: policy.retention_days,
        last_cleanup_at: policy.last_cleanup_at,
    }))
}

/// Update log retention policy for a specific log type.
///
/// # Arguments
/// * `state` - The base HTTP state.
/// * `_auth_user` - The authenticated user.
/// * `req` - The request body.
///
/// # Returns
/// * `AppResult<Json<LogRetentionPolicyResp>>` - The updated log retention policy response.
pub async fn update_policy(
    State(state): State<BaseHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
    Json(req): Json<UpdateLogRetentionPolicyReq>,
) -> AppResult<Json<LogRetentionPolicyResp>> {
    if !["system_log", "audit_log", "operation_log"].contains(&req.log_type.as_str()) {
        return Err(AppError::data_here(format!(
            "Invalid log type: {}",
            req.log_type
        )));
    }

    let repo = state.log_retention_repo.clone();
    let policy = repo.update(&req.log_type, req.retention_days).await?;

    Ok(Json(LogRetentionPolicyResp {
        log_type: policy.log_type,
        retention_days: policy.retention_days,
        last_cleanup_at: policy.last_cleanup_at,
    }))
}
