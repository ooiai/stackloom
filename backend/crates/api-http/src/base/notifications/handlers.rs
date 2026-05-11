use crate::base::{BaseHttpState, logging};
use domain_base::PublishNotificationCmd;
use neocrates::{
    axum::{Extension, Json, extract::State},
    helper::core::axum_extractor::DetailedJson,
    middlewares::{RequestTraceContext, models::AuthModel},
    response::error::{AppError, AppResult},
    tracing,
};
use validator::Validate;

use super::{
    req::{
        CreateNotificationRuleReq, CreateNotificationTemplateReq, PageNotificationDispatchReq,
        PageNotificationRuleReq, PageNotificationTemplateReq, SendNotificationReq,
        UpdateNotificationRuleReq, UpdateNotificationTemplateReq,
    },
    resp::{
        NotificationDispatchResp, NotificationRuleResp, NotificationTemplateResp,
        PaginateNotificationDispatchResp, PaginateNotificationRuleResp,
        PaginateNotificationTemplateResp,
    },
};

pub async fn page_dispatches(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageNotificationDispatchReq>,
) -> AppResult<Json<PaginateNotificationDispatchResp>> {
    tracing::info!(tenant_id = auth_user.tid, "...Page Notification Dispatches...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let (items, total) = state
        .notification_service
        .page_dispatches(req.into_cmd(auth_user.tid))
        .await?;

    Ok(Json(PaginateNotificationDispatchResp {
        items: items.into_iter().map(NotificationDispatchResp::from).collect(),
        total: total as usize,
    }))
}

pub async fn send(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<SendNotificationReq>,
) -> AppResult<Json<NotificationDispatchResp>> {
    tracing::info!(tenant_id = auth_user.tid, operator_id = auth_user.uid, "...Send Notification...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd: PublishNotificationCmd = req
        .into_cmd(auth_user.tid, auth_user.uid)
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let dispatch = state.notification_service.publish(cmd).await?;
    let resp = NotificationDispatchResp::from(dispatch);
    let snapshot = logging::serialize_snapshot(resp.clone());
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "notifications",
        "notification_dispatch",
        Some(resp.id),
        resp.id.to_string(),
        "send",
        "manual send notification".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(resp))
}

pub async fn page_templates(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageNotificationTemplateReq>,
) -> AppResult<Json<PaginateNotificationTemplateResp>> {
    tracing::info!(tenant_id = auth_user.tid, "...Page Notification Templates...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let (items, total) = state
        .notification_service
        .page_templates(req.into_cmd(auth_user.tid))
        .await?;

    Ok(Json(PaginateNotificationTemplateResp {
        items: items.into_iter().map(NotificationTemplateResp::from).collect(),
        total: total as usize,
    }))
}

pub async fn create_template(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateNotificationTemplateReq>,
) -> AppResult<Json<NotificationTemplateResp>> {
    tracing::info!(tenant_id = auth_user.tid, operator_id = auth_user.uid, "...Create Notification Template...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let template = state
        .notification_service
        .create_template(req.into_cmd(auth_user.tid, auth_user.uid))
        .await?;
    let resp = NotificationTemplateResp::from(template);
    let snapshot = logging::serialize_snapshot(resp.clone());
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "notifications",
        "notification_template",
        Some(resp.id),
        resp.id.to_string(),
        "create",
        "create notification template".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(resp))
}

pub async fn update_template(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateNotificationTemplateReq>,
) -> AppResult<Json<NotificationTemplateResp>> {
    tracing::info!(tenant_id = auth_user.tid, operator_id = auth_user.uid, template_id = req.id, "...Update Notification Template...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let id = req.id;
    let template = state
        .notification_service
        .update_template(auth_user.tid, id, req.into())
        .await?;
    let resp = NotificationTemplateResp::from(template);
    let snapshot = logging::serialize_snapshot(resp.clone());
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "notifications",
        "notification_template",
        Some(resp.id),
        resp.id.to_string(),
        "update",
        "update notification template".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(resp))
}

pub async fn page_rules(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    DetailedJson(req): DetailedJson<PageNotificationRuleReq>,
) -> AppResult<Json<PaginateNotificationRuleResp>> {
    tracing::info!(tenant_id = auth_user.tid, "...Page Notification Rules...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let (items, total) = state
        .notification_service
        .page_rules(req.into_cmd(auth_user.tid))
        .await?;

    Ok(Json(PaginateNotificationRuleResp {
        items: items.into_iter().map(NotificationRuleResp::from).collect(),
        total: total as usize,
    }))
}

pub async fn create_rule(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<CreateNotificationRuleReq>,
) -> AppResult<Json<NotificationRuleResp>> {
    tracing::info!(tenant_id = auth_user.tid, operator_id = auth_user.uid, "...Create Notification Rule...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let cmd = req
        .into_cmd(auth_user.tid, auth_user.uid)
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let rule = state.notification_service.create_rule(cmd).await?;
    let resp = NotificationRuleResp::from(rule);
    let snapshot = logging::serialize_snapshot(resp.clone());
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "notifications",
        "notification_rule",
        Some(resp.id),
        resp.id.to_string(),
        "create",
        "create notification rule".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(resp))
}

pub async fn update_rule(
    State(state): State<BaseHttpState>,
    Extension(auth_user): Extension<AuthModel>,
    Extension(trace_context): Extension<RequestTraceContext>,
    DetailedJson(req): DetailedJson<UpdateNotificationRuleReq>,
) -> AppResult<Json<NotificationRuleResp>> {
    tracing::info!(tenant_id = auth_user.tid, operator_id = auth_user.uid, rule_id = req.id, "...Update Notification Rule...");

    req.validate()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

    let id = req.id;
    let cmd = req
        .into_cmd()
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let rule = state
        .notification_service
        .update_rule(auth_user.tid, id, cmd)
        .await?;
    let resp = NotificationRuleResp::from(rule);
    let snapshot = logging::serialize_snapshot(resp.clone());
    logging::write_mutation_logs(
        &state,
        &trace_context,
        "notifications",
        "notification_rule",
        Some(resp.id),
        resp.id.to_string(),
        "update",
        "update notification rule".to_string(),
        None,
        Some(snapshot),
    )
    .await;

    Ok(Json(resp))
}
