use domain_system::CreateAuditLogCmd;
use domain_web::CreateOperationLogCmd;
use neocrates::{
    middlewares::RequestTraceContext,
    serde::Serialize,
    serde_json::{self, Value, json},
    tracing,
};

use super::BaseHttpState;

pub fn serialize_snapshot<T>(value: T) -> Value
where
    T: Serialize,
{
    match serde_json::to_value(value).ok() {
        Some(Value::Object(value)) => Value::Object(value),
        _ => empty_object(),
    }
}

pub async fn write_mutation_logs(
    state: &BaseHttpState,
    trace_context: &RequestTraceContext,
    module: &str,
    biz_type: &str,
    biz_id: Option<i64>,
    target_id: String,
    operation: &str,
    summary: String,
    before_snapshot: Option<Value>,
    after_snapshot: Option<Value>,
) {
    let before_snapshot = normalize_snapshot(before_snapshot);
    let after_snapshot = normalize_snapshot(after_snapshot);
    let target_id = if target_id.trim().is_empty() {
        biz_id
            .map(|value| value.to_string())
            .unwrap_or_else(|| "unknown".to_string())
    } else {
        target_id
    };

    if let Err(err) = state
        .audit_log_service
        .create(CreateAuditLogCmd {
            id: 0,
            trace_id: trace_context.trace_id.clone(),
            tenant_id: trace_context.tenant_id,
            operator_id: trace_context.operator_id,
            target_type: biz_type.to_string(),
            target_id: target_id.clone(),
            action: operation.to_string(),
            result: "success".to_string(),
            reason: None,
            before_data: Some(before_snapshot.clone()),
            after_data: Some(after_snapshot.clone()),
            ip: trace_context.ip.clone(),
            user_agent: trace_context.user_agent.clone(),
        })
        .await
    {
        tracing::warn!("failed to persist audit log for {module}/{operation}: {err:?}");
    }

    if let Err(err) = state
        .operation_log_service
        .create(CreateOperationLogCmd {
            id: 0,
            tenant_id: trace_context.tenant_id,
            operator_id: trace_context.operator_id,
            module: module.to_string(),
            biz_type: biz_type.to_string(),
            biz_id,
            operation: operation.to_string(),
            summary,
            result: 1,
            before_snapshot: Some(before_snapshot),
            after_snapshot: Some(after_snapshot),
            trace_id: trace_context.trace_id.clone(),
        })
        .await
    {
        tracing::warn!("failed to persist operation log for {module}/{operation}: {err:?}");
    }
}

fn normalize_snapshot(value: Option<Value>) -> Value {
    match value {
        Some(Value::Object(value)) => Value::Object(value),
        Some(_) | None => empty_object(),
    }
}

fn empty_object() -> Value {
    json!({})
}
