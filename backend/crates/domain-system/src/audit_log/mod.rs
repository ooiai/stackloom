pub mod repo;
pub mod service;

pub use repo::AuditLogRepository;
pub use service::AuditLogService;

use chrono::{DateTime, Utc};
use neocrates::response::error::{AppError, AppResult};
use serde_json::Value;

#[derive(Debug, Clone)]
pub struct AuditLog {
    pub id: i64,
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: String,
    pub target_id: String,
    pub action: String,
    pub result: String,
    pub reason: Option<String>,
    pub before_data: Value,
    pub after_data: Value,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl AuditLog {
    pub fn new(cmd: CreateAuditLogCmd) -> AppResult<Self> {
        Ok(Self {
            id: cmd.id,
            trace_id: normalize_optional_string(cmd.trace_id),
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            target_type: normalize_required_string("target_type", cmd.target_type)?,
            target_id: normalize_required_string("target_id", cmd.target_id)?,
            action: normalize_required_string("action", cmd.action)?,
            result: normalize_required_string("result", cmd.result)?,
            reason: normalize_optional_string(cmd.reason),
            before_data: normalize_json(cmd.before_data),
            after_data: normalize_json(cmd.after_data),
            ip: normalize_optional_string(cmd.ip),
            user_agent: normalize_optional_string(cmd.user_agent),
            created_at: Utc::now(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct CreateAuditLogCmd {
    pub id: i64,
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: String,
    pub target_id: String,
    pub action: String,
    pub result: String,
    pub reason: Option<String>,
    pub before_data: Option<Value>,
    pub after_data: Option<Value>,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
}

impl CreateAuditLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        let _ = normalize_required_string("target_type", self.target_type.clone())?;
        let _ = normalize_required_string("target_id", self.target_id.clone())?;
        let _ = normalize_required_string("action", self.action.clone())?;
        let _ = normalize_required_string("result", self.result.clone())?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct AuditLogFilter {
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub action: Option<String>,
    pub result: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
}

impl AuditLogFilter {
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
pub struct PageAuditLogCmd {
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub action: Option<String>,
    pub result: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl PageAuditLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        AuditLogFilter::from(self.clone()).validate()?;

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
pub struct ListAuditLogCmd {
    pub trace_id: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub action: Option<String>,
    pub result: Option<String>,
    pub created_at_start: Option<DateTime<Utc>>,
    pub created_at_end: Option<DateTime<Utc>>,
}

impl ListAuditLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        AuditLogFilter::from(self.clone()).validate()
    }
}

#[derive(Debug, Clone, Default)]
pub struct AuditLogPageQuery {
    pub filter: AuditLogFilter,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageAuditLogCmd> for AuditLogPageQuery {
    fn from(cmd: PageAuditLogCmd) -> Self {
        Self {
            filter: AuditLogFilter {
                trace_id: cmd.trace_id,
                tenant_id: cmd.tenant_id,
                operator_id: cmd.operator_id,
                target_type: cmd.target_type,
                target_id: cmd.target_id,
                action: cmd.action,
                result: cmd.result,
                created_at_start: cmd.created_at_start,
                created_at_end: cmd.created_at_end,
            },
            limit: cmd.limit,
            offset: cmd.offset,
        }
    }
}

impl From<PageAuditLogCmd> for AuditLogFilter {
    fn from(cmd: PageAuditLogCmd) -> Self {
        Self {
            trace_id: cmd.trace_id,
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            target_type: cmd.target_type,
            target_id: cmd.target_id,
            action: cmd.action,
            result: cmd.result,
            created_at_start: cmd.created_at_start,
            created_at_end: cmd.created_at_end,
        }
    }
}

impl From<ListAuditLogCmd> for AuditLogFilter {
    fn from(cmd: ListAuditLogCmd) -> Self {
        Self {
            trace_id: cmd.trace_id,
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            target_type: cmd.target_type,
            target_id: cmd.target_id,
            action: cmd.action,
            result: cmd.result,
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
