pub mod repo;
pub mod service;

pub use repo::OperationLogRepository;
pub use service::OperationLogService;

use chrono::{DateTime, Utc};
use neocrates::response::error::{AppError, AppResult};
use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationLog {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: String,
    pub biz_type: String,
    pub biz_id: Option<i64>,
    pub operation: String,
    pub summary: String,
    pub result: i16,
    pub before_snapshot: Value,
    pub after_snapshot: Value,
    pub trace_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl OperationLog {
    pub fn new(cmd: CreateOperationLogCmd) -> AppResult<Self> {
        cmd.validate()?;

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            operator_id: cmd.operator_id,
            module: cmd.module,
            biz_type: cmd.biz_type,
            biz_id: cmd.biz_id,
            operation: cmd.operation,
            summary: cmd.summary,
            result: cmd.result,
            before_snapshot: cmd.before_snapshot.unwrap_or_else(default_snapshot),
            after_snapshot: cmd.after_snapshot.unwrap_or_else(default_snapshot),
            trace_id: cmd.trace_id,
            created_at: Utc::now(),
        })
    }

    pub fn validate_result(value: i16) -> AppResult<()> {
        match value {
            0 | 1 => Ok(()),
            _ => Err(AppError::ValidationError(format!(
                "invalid operation log result value: {value}"
            ))),
        }
    }
}

#[derive(Debug, Clone)]
pub struct CreateOperationLogCmd {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: String,
    pub biz_type: String,
    pub biz_id: Option<i64>,
    pub operation: String,
    pub summary: String,
    pub result: i16,
    pub before_snapshot: Option<Value>,
    pub after_snapshot: Option<Value>,
    pub trace_id: Option<String>,
}

impl CreateOperationLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        validate_required_text("module", &self.module)?;
        validate_required_text("biz_type", &self.biz_type)?;
        validate_required_text("operation", &self.operation)?;
        validate_required_text("summary", &self.summary)?;

        if let Some(trace_id) = self.trace_id.as_ref() {
            validate_required_text("trace_id", trace_id)?;
        }

        OperationLog::validate_result(self.result)?;

        if let Some(snapshot) = self.before_snapshot.as_ref() {
            validate_snapshot("before_snapshot", snapshot)?;
        }

        if let Some(snapshot) = self.after_snapshot.as_ref() {
            validate_snapshot("after_snapshot", snapshot)?;
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct OperationLogFilter {
    pub keyword: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: Option<String>,
    pub biz_type: Option<String>,
    pub biz_id: Option<i64>,
    pub operation: Option<String>,
    pub result: Option<i16>,
    pub trace_id: Option<String>,
    pub created_from: Option<DateTime<Utc>>,
    pub created_to: Option<DateTime<Utc>>,
}

impl OperationLogFilter {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(result) = self.result {
            OperationLog::validate_result(result)?;
        }

        if matches!(
            (self.created_from, self.created_to),
            (Some(created_from), Some(created_to)) if created_from > created_to
        ) {
            return Err(AppError::ValidationError(
                "created_from cannot be greater than created_to".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageOperationLogCmd {
    pub keyword: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: Option<String>,
    pub biz_type: Option<String>,
    pub biz_id: Option<i64>,
    pub operation: Option<String>,
    pub result: Option<i16>,
    pub trace_id: Option<String>,
    pub created_from: Option<DateTime<Utc>>,
    pub created_to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl PageOperationLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        build_filter(self).validate()?;
        validate_limit(self.limit)?;
        validate_offset(self.offset)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct ListOperationLogCmd {
    pub keyword: Option<String>,
    pub tenant_id: Option<i64>,
    pub operator_id: Option<i64>,
    pub module: Option<String>,
    pub biz_type: Option<String>,
    pub biz_id: Option<i64>,
    pub operation: Option<String>,
    pub result: Option<i16>,
    pub trace_id: Option<String>,
    pub created_from: Option<DateTime<Utc>>,
    pub created_to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
}

impl ListOperationLogCmd {
    pub fn validate(&self) -> AppResult<()> {
        build_filter(self).validate()?;
        validate_limit(self.limit)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct OperationLogPageQuery {
    pub filter: OperationLogFilter,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct OperationLogListQuery {
    pub filter: OperationLogFilter,
    pub limit: Option<i64>,
}

fn default_snapshot() -> Value {
    Value::Object(Default::default())
}

fn validate_required_text(field: &str, value: &str) -> AppResult<()> {
    if value.trim().is_empty() {
        return Err(AppError::ValidationError(format!(
            "{field} cannot be empty"
        )));
    }

    Ok(())
}

fn validate_snapshot(field: &str, value: &Value) -> AppResult<()> {
    if !value.is_object() {
        return Err(AppError::ValidationError(format!(
            "{field} must be a JSON object"
        )));
    }

    Ok(())
}

fn validate_limit(limit: Option<i64>) -> AppResult<()> {
    if matches!(limit, Some(limit) if limit <= 0) {
        return Err(AppError::ValidationError(
            "limit must be greater than 0".to_string(),
        ));
    }

    Ok(())
}

fn validate_offset(offset: Option<i64>) -> AppResult<()> {
    if matches!(offset, Some(offset) if offset < 0) {
        return Err(AppError::ValidationError(
            "offset cannot be negative".to_string(),
        ));
    }

    Ok(())
}

fn build_filter<T>(cmd: &T) -> OperationLogFilter
where
    T: OperationLogFilterSource,
{
    OperationLogFilter {
        keyword: cmd.keyword().cloned(),
        tenant_id: cmd.tenant_id(),
        operator_id: cmd.operator_id(),
        module: cmd.module().cloned(),
        biz_type: cmd.biz_type().cloned(),
        biz_id: cmd.biz_id(),
        operation: cmd.operation().cloned(),
        result: cmd.result(),
        trace_id: cmd.trace_id().cloned(),
        created_from: cmd.created_from(),
        created_to: cmd.created_to(),
    }
}

trait OperationLogFilterSource {
    fn keyword(&self) -> Option<&String>;
    fn tenant_id(&self) -> Option<i64>;
    fn operator_id(&self) -> Option<i64>;
    fn module(&self) -> Option<&String>;
    fn biz_type(&self) -> Option<&String>;
    fn biz_id(&self) -> Option<i64>;
    fn operation(&self) -> Option<&String>;
    fn result(&self) -> Option<i16>;
    fn trace_id(&self) -> Option<&String>;
    fn created_from(&self) -> Option<DateTime<Utc>>;
    fn created_to(&self) -> Option<DateTime<Utc>>;
}

impl OperationLogFilterSource for PageOperationLogCmd {
    fn keyword(&self) -> Option<&String> {
        self.keyword.as_ref()
    }

    fn tenant_id(&self) -> Option<i64> {
        self.tenant_id
    }

    fn operator_id(&self) -> Option<i64> {
        self.operator_id
    }

    fn module(&self) -> Option<&String> {
        self.module.as_ref()
    }

    fn biz_type(&self) -> Option<&String> {
        self.biz_type.as_ref()
    }

    fn biz_id(&self) -> Option<i64> {
        self.biz_id
    }

    fn operation(&self) -> Option<&String> {
        self.operation.as_ref()
    }

    fn result(&self) -> Option<i16> {
        self.result
    }

    fn trace_id(&self) -> Option<&String> {
        self.trace_id.as_ref()
    }

    fn created_from(&self) -> Option<DateTime<Utc>> {
        self.created_from
    }

    fn created_to(&self) -> Option<DateTime<Utc>> {
        self.created_to
    }
}

impl OperationLogFilterSource for ListOperationLogCmd {
    fn keyword(&self) -> Option<&String> {
        self.keyword.as_ref()
    }

    fn tenant_id(&self) -> Option<i64> {
        self.tenant_id
    }

    fn operator_id(&self) -> Option<i64> {
        self.operator_id
    }

    fn module(&self) -> Option<&String> {
        self.module.as_ref()
    }

    fn biz_type(&self) -> Option<&String> {
        self.biz_type.as_ref()
    }

    fn biz_id(&self) -> Option<i64> {
        self.biz_id
    }

    fn operation(&self) -> Option<&String> {
        self.operation.as_ref()
    }

    fn result(&self) -> Option<i16> {
        self.result
    }

    fn trace_id(&self) -> Option<&String> {
        self.trace_id.as_ref()
    }

    fn created_from(&self) -> Option<DateTime<Utc>> {
        self.created_from
    }

    fn created_to(&self) -> Option<DateTime<Utc>> {
        self.created_to
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{CreateOperationLogCmd, OperationLog, PageOperationLogCmd};

    #[test]
    fn new_operation_log_defaults_snapshots_to_empty_objects() {
        let operation_log = OperationLog::new(CreateOperationLogCmd {
            id: 1,
            tenant_id: Some(10),
            operator_id: Some(20),
            module: "users".to_string(),
            biz_type: "user".to_string(),
            biz_id: Some(30),
            operation: "create".to_string(),
            summary: "create user".to_string(),
            result: 1,
            before_snapshot: None,
            after_snapshot: None,
            trace_id: Some("trace-1".to_string()),
        })
        .expect("operation log should be created");

        assert_eq!(operation_log.before_snapshot, json!({}));
        assert_eq!(operation_log.after_snapshot, json!({}));
    }

    #[test]
    fn create_operation_log_rejects_non_object_snapshots() {
        let result = CreateOperationLogCmd {
            id: 1,
            tenant_id: None,
            operator_id: None,
            module: "users".to_string(),
            biz_type: "user".to_string(),
            biz_id: None,
            operation: "update".to_string(),
            summary: "update user".to_string(),
            result: 1,
            before_snapshot: Some(json!(["invalid"])),
            after_snapshot: None,
            trace_id: None,
        }
        .validate();

        assert!(result.is_err());
    }

    #[test]
    fn page_command_rejects_negative_offset() {
        let result = PageOperationLogCmd {
            offset: Some(-1),
            ..Default::default()
        }
        .validate();

        assert!(result.is_err());
    }
}
