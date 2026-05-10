use super::resp::LogRetentionPolicyResp;
use super::req::{GetLogRetentionPolicyReq, UpdateLogRetentionPolicyReq};
use crate::base::BaseHttpState;
use domain_base::LogRetentionPolicy;
use neocrates::{
    axum::{extract::State, Json},
    response::error::{AppError, AppResult},
};

pub async fn get_policy(
    State(state): State<BaseHttpState>,
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

pub async fn update_policy(
    State(state): State<BaseHttpState>,
    Json(req): Json<UpdateLogRetentionPolicyReq>,
) -> AppResult<Json<LogRetentionPolicyResp>> {
    if !["system_log", "audit_log", "operation_log"].contains(&req.log_type.as_str()) {
        return Err(AppError::data_here(format!("Invalid log type: {}", req.log_type)));
    }

    let repo = state.log_retention_repo.clone();
    let policy = repo.update(&req.log_type, req.retention_days).await?;

    Ok(Json(LogRetentionPolicyResp {
        log_type: policy.log_type,
        retention_days: policy.retention_days,
        last_cleanup_at: policy.last_cleanup_at,
    }))
}
