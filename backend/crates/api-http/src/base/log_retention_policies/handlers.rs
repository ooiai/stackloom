use super::resp::LogRetentionPolicyResp;
use super::req::UpdateLogRetentionPolicyReq;
use crate::base::BaseHttpState;
use domain_base::LogRetentionPolicy;
use neocrates::{
    axum::{extract::Path, extract::State, Json},
    response::error::{AppError, AppResult},
};

/// Get log retention policy for a specific log type
///
/// # Arguments
/// * `state` - The base HTTP state
/// * `log_type` - The log type (system_log, audit_log, or operation_log)
///
/// # Returns
/// * `AppResult<Json<LogRetentionPolicyResp>>` - The log retention policy
pub async fn get_policy(
    State(state): State<BaseHttpState>,
    Path(log_type): Path<String>,
) -> AppResult<Json<LogRetentionPolicyResp>> {
    let repo = state.log_retention_repo.clone();
    let policy = repo.get(&log_type).await?;

    // If not found, return default policy (keep forever)
    let policy = policy.unwrap_or_else(|| LogRetentionPolicy {
        id: 0,
        log_type: log_type.clone(),
        retention_days: None,
        last_cleanup_at: None,
    });

    Ok(Json(LogRetentionPolicyResp {
        log_type: policy.log_type,
        retention_days: policy.retention_days,
        last_cleanup_at: policy.last_cleanup_at,
    }))
}

/// Update log retention policy for a specific log type (requires admin permission)
///
/// # Arguments
/// * `state` - The base HTTP state
/// * `log_type` - The log type (system_log, audit_log, or operation_log)
/// * `req` - The update request containing new retention days
///
/// # Returns
/// * `AppResult<Json<LogRetentionPolicyResp>>` - The updated log retention policy
pub async fn update_policy(
    State(state): State<BaseHttpState>,
    Path(log_type): Path<String>,
    Json(req): Json<UpdateLogRetentionPolicyReq>,
) -> AppResult<Json<LogRetentionPolicyResp>> {
    // Validate log_type is one of the allowed values
    if !["system_log", "audit_log", "operation_log"].contains(&log_type.as_str()) {
        return Err(AppError::data_here(format!("Invalid log type: {}", log_type)));
    }

    let repo = state.log_retention_repo.clone();
    let policy = repo.update(&log_type, req.retention_days).await?;

    Ok(Json(LogRetentionPolicyResp {
        log_type: policy.log_type,
        retention_days: policy.retention_days,
        last_cleanup_at: policy.last_cleanup_at,
    }))
}
