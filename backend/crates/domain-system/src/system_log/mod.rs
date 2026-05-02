pub mod repo;
pub mod service;

pub use repo::SystemLogRepository;
pub use service::SystemLogService;

use chrono::{DateTime, Utc};
use neocrates::response::error::{AppError, AppResult};
use serde_json::Value;

#[derive(Debug, Clone)]
pub struct SystemLog {
    pub id: i64,
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: String,
    pub path: String,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: i32,
    pub latency_ms: i64,
    pub result: String,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub ext: Value,
    pub created_at: DateTime<Utc>,
}

impl SystemLog {
    pub fn new(cmd: CreateSystemLogCmd) -> AppResult<Self> {
        let method = normalize_required_string("method", cmd.method)?.to_ascii_uppercase();
        let path = normalize_required_string("path", cmd.path)?;
        let result = normalize_required_string("result", cmd.result)?;

        if cmd.status_code < 0 {
            return Err(AppError::ValidationError(
                "status_code must be greater than or equal to 0".to_string(),
            ));
        }

        if cmd.latency_ms < 0 {
            return Err(AppError::ValidationError(
                "latency_ms must be greater than or equal to 0".to_string(),
            ));
        }

        Ok(Self {
            id: cmd.id,
            trace_id: normalize_optional_string(cmd.trace_id),
            request_id: normalize_optional_string(cmd.request_id),
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            method,
            path,
            module: normalize_optional_string(cmd.module),
            action: normalize_optional_string(cmd.action),
            status_code: cmd.status_code,
            latency_ms: cmd.latency_ms,
            result,
            error_code: normalize_optional_string(cmd.error_code),
            error_message: normalize_optional_string(cmd.error_message),
            ip: normalize_optional_string(cmd.ip),
            user_agent: normalize_optional_string(cmd.user_agent),
            ext: normalize_json(cmd.ext),
            created_at: Utc::now(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct CreateSystemLogCmd {
    pub id: i64,
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: String,
    pub path: String,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: i32,
    pub latency_ms: i64,
    pub result: String,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub ext: Option<Value>,
}

impl CreateSystemLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        let _ = normalize_required_string("method", self.method.clone())?;
        let _ = normalize_required_string("path", self.path.clone())?;
        let _ = normalize_required_string("result", self.result.clone())?;

        if self.status_code < 0 {
            return Err(AppError::ValidationError(
                "status_code must be greater than or equal to 0".to_string(),
            ));
        }

        if self.latency_ms < 0 {
            return Err(AppError::ValidationError(
                "latency_ms must be greater than or equal to 0".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct SystemLogFilter {
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: Option<i32>,
    pub result: Option<String>,
    pub error_code: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
}

impl SystemLogFilter {
    pub fn validate(&self) -> AppResult<()> {
        if let (Some(start), Some(end)) = (self.created_at_start, self.created_at_end)
            && start > end
        {
            return Err(AppError::ValidationError(
                "created_at_start cannot be later than created_at_end".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageSystemLogCmd {
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: Option<i32>,
    pub result: Option<String>,
    pub error_code: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl PageSystemLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        SystemLogFilter::from(self.clone()).validate()?;

        if let Some(limit) = self.limit
            && limit <= 0
        {
            return Err(AppError::ValidationError(
                "limit must be greater than 0".to_string(),
            ));
        }

        if let Some(offset) = self.offset
            && offset < 0
        {
            return Err(AppError::ValidationError(
                "offset must be greater than or equal to 0".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct ListSystemLogCmd {
    pub trace_id: Option<String>,
    pub request_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub module: Option<String>,
    pub action: Option<String>,
    pub status_code: Option<i32>,
    pub result: Option<String>,
    pub error_code: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
}

impl ListSystemLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        SystemLogFilter::from(self.clone()).validate()
    }
}

#[derive(Debug, Clone, Default)]
pub struct SystemLogPageQuery {
    pub filter: SystemLogFilter,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageSystemLogCmd> for SystemLogPageQuery {
    fn from(cmd: PageSystemLogCmd) -> Self {
        Self {
            filter: SystemLogFilter {
                trace_id: cmd.trace_id,
                request_id: cmd.request_id,
                tenant_id: cmd.tenant_id,
                operator_id: cmd.operator_id,
                method: cmd.method,
                path: cmd.path,
                module: cmd.module,
                action: cmd.action,
                status_code: cmd.status_code,
                result: cmd.result,
                error_code: cmd.error_code,
                created_at_start: cmd.created_at_start,
                created_at_end: cmd.created_at_end,
            },
            limit: cmd.limit,
            offset: cmd.offset,
        }
    }
}

impl From<PageSystemLogCmd> for SystemLogFilter {
    fn from(cmd: PageSystemLogCmd) -> Self {
        Self {
            trace_id: cmd.trace_id,
            request_id: cmd.request_id,
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            method: cmd.method,
            path: cmd.path,
            module: cmd.module,
            action: cmd.action,
            status_code: cmd.status_code,
            result: cmd.result,
            error_code: cmd.error_code,
            created_at_start: cmd.created_at_start,
            created_at_end: cmd.created_at_end,
        }
    }
}

impl From<ListSystemLogCmd> for SystemLogFilter {
    fn from(cmd: ListSystemLogCmd) -> Self {
        Self {
            trace_id: cmd.trace_id,
            request_id: cmd.request_id,
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            method: cmd.method,
            path: cmd.path,
            module: cmd.module,
            action: cmd.action,
            status_code: cmd.status_code,
            result: cmd.result,
            error_code: cmd.error_code,
            created_at_start: cmd.created_at_start,
            created_at_end: cmd.created_at_end,
        }
    }
}

fn normalize_required_string(name: &str, value: String) -> AppResult<String> {
    let value = value.trim().to_string();
    if value.is_empty() {
        return Err(AppError::ValidationError(format!("{name} cannot be empty")));
    }

    Ok(value)
}

fn normalize_optional_string(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let value = value.trim().to_string();
        if value.is_empty() { None } else { Some(value) }
    })
}

fn normalize_json(value: Option<Value>) -> Value {
    match value {
        Some(Value::Null) | None => Value::Object(Default::default()),
        Some(value) => value,
    }
}
