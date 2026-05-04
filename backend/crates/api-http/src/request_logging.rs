use std::{sync::Arc, time::Instant};

use domain_system::{CreateSystemLogCmd, SystemLogService};
use neocrates::{
    axum::{
        extract::{MatchedPath, Request, State},
        middleware::Next,
        response::Response,
    },
    middlewares::{models::AuthModel, trace_request},
    serde_json::json,
    tracing,
};

use crate::{auth::AuthHttpState, base::BaseHttpState, system::SysHttpState};

pub async fn base_request_trace_middleware(
    State(state): State<BaseHttpState>,
    request: Request,
    next: Next,
) -> Response {
    request_trace_middleware_impl(state.system_log_service.clone(), request, next).await
}

pub async fn sys_request_trace_middleware(
    State(state): State<SysHttpState>,
    request: Request,
    next: Next,
) -> Response {
    request_trace_middleware_impl(state.system_log_service.clone(), request, next).await
}

pub async fn auth_request_trace_middleware(
    State(state): State<AuthHttpState>,
    request: Request,
    next: Next,
) -> Response {
    request_trace_middleware_impl(state.system_log_service.clone(), request, next).await
}

async fn request_trace_middleware_impl(
    system_log_service: Arc<dyn SystemLogService>,
    request: Request,
    next: Next,
) -> Response {
    let started_at = Instant::now();
    let matched_path = request
        .extensions()
        .get::<MatchedPath>()
        .map(|value| value.as_str().to_string());
    let request_path = matched_path
        .clone()
        .unwrap_or_else(|| request.uri().path().to_string());
    let request_query = request.uri().query().map(str::to_string);
    let (module, action) = infer_module_action(&request_path);

    let method = request.method().to_string();
    let (trace_context, response) = trace_request(request, next, |request, trace_context| {
        let auth_model = request.extensions().get::<AuthModel>();
        trace_context.with_identity(
            auth_model.and_then(|auth| (auth.tid > 0).then_some(auth.tid)),
            auth_model.and_then(|auth| (auth.uid > 0).then_some(auth.uid)),
        )
    })
    .await;

    let status = response.status();
    let latency_ms = started_at.elapsed().as_millis().min(i64::MAX as u128) as i64;
    let result = if status.is_client_error() || status.is_server_error() {
        "failure"
    } else {
        "success"
    }
    .to_string();
    let error_code = if status.is_client_error() || status.is_server_error() {
        Some(status.as_u16().to_string())
    } else {
        None
    };

    let ext = json!({
        "matched_path": matched_path,
        "query": request_query,
    });

    if let Err(err) = system_log_service
        .create(CreateSystemLogCmd {
            id: 0,
            trace_id: trace_context.trace_id.clone(),
            request_id: trace_context.request_id.clone(),
            tenant_id: trace_context.tenant_id,
            operator_id: trace_context.operator_id,
            method,
            path: request_path,
            module,
            action,
            status_code: status.as_u16() as i32,
            latency_ms,
            result,
            error_code,
            error_message: None,
            ip: trace_context.ip,
            user_agent: trace_context.user_agent,
            ext: Some(ext),
        })
        .await
    {
        tracing::warn!("failed to persist system log: {err:?}");
    }

    response
}

fn infer_module_action(path: &str) -> (Option<String>, Option<String>) {
    let segments = path
        .trim_matches('/')
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>();

    if segments.len() >= 3 {
        return (
            Some(segments[1..segments.len() - 1].join("/")),
            Some(segments[segments.len() - 1].to_string()),
        );
    }

    if segments.len() == 2 {
        return (Some(segments[1].to_string()), None);
    }

    (None, None)
}
