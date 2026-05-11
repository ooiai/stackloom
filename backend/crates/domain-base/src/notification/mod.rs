pub mod repo;
pub mod service;

pub use repo::NotificationRepository;
pub use service::NotificationService;

use chrono::{DateTime, NaiveTime, Utc};
use neocrates::{
    response::error::{AppError, AppResult},
    serde_json::{Value, json},
};

pub const NOTIFICATION_SELECTOR_TENANT_ALL: &str = "tenant_all";
pub const NOTIFICATION_SELECTOR_EXPLICIT_USERS: &str = "explicit_users";
pub const NOTIFICATION_SELECTOR_ACTOR: &str = "actor";
pub const NOTIFICATION_SELECTOR_TENANT_ADMINS: &str = "tenant_admins";

pub const NOTIFICATION_TRIGGER_MANUAL: &str = "manual";
pub const NOTIFICATION_TRIGGER_DIRECT: &str = "direct";
pub const NOTIFICATION_TRIGGER_EVENT: &str = "event";
pub const NOTIFICATION_TRIGGER_DELAY_ONCE: &str = "delay_once";
pub const NOTIFICATION_TRIGGER_FIXED_SCHEDULE: &str = "fixed_schedule";
pub const NOTIFICATION_TRIGGER_CRON_EXPRESSION: &str = "cron_expression";

pub const NOTIFICATION_SCHEDULE_DAILY: &str = "daily";
pub const NOTIFICATION_SCHEDULE_WEEKLY: &str = "weekly";

pub const NOTIFICATION_CATCHUP_FIRE_ONCE: &str = "fire_once";

pub const NOTIFICATION_STREAM_REASON_CREATED: &str = "created";
pub const NOTIFICATION_STREAM_REASON_REFRESH: &str = "refresh";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotificationRecipientSelector {
    TenantAll,
    ExplicitUsers(Vec<i64>),
    Actor,
    TenantAdmins,
}

impl NotificationRecipientSelector {
    pub fn explicit_users(user_ids: Vec<i64>) -> Self {
        Self::ExplicitUsers(user_ids)
    }

    pub fn selector_type(&self) -> &'static str {
        match self {
            Self::TenantAll => NOTIFICATION_SELECTOR_TENANT_ALL,
            Self::ExplicitUsers(_) => NOTIFICATION_SELECTOR_EXPLICIT_USERS,
            Self::Actor => NOTIFICATION_SELECTOR_ACTOR,
            Self::TenantAdmins => NOTIFICATION_SELECTOR_TENANT_ADMINS,
        }
    }

    pub fn to_payload(&self) -> Value {
        match self {
            Self::ExplicitUsers(user_ids) => json!({ "user_ids": user_ids }),
            _ => json!({}),
        }
    }

    pub fn validate(&self) -> AppResult<()> {
        if let Self::ExplicitUsers(user_ids) = self {
            if user_ids.is_empty() {
                return Err(AppError::ValidationError(
                    "recipient_user_ids cannot be empty".to_string(),
                ));
            }
        }

        Ok(())
    }

    pub fn from_parts(selector_type: &str, payload: &Value) -> AppResult<Self> {
        match selector_type {
            NOTIFICATION_SELECTOR_TENANT_ALL => Ok(Self::TenantAll),
            NOTIFICATION_SELECTOR_ACTOR => Ok(Self::Actor),
            NOTIFICATION_SELECTOR_TENANT_ADMINS => Ok(Self::TenantAdmins),
            NOTIFICATION_SELECTOR_EXPLICIT_USERS => {
                let user_ids = payload
                    .get("user_ids")
                    .and_then(Value::as_array)
                    .ok_or_else(|| {
                        AppError::ValidationError(
                            "recipient_user_ids payload is required".to_string(),
                        )
                    })?
                    .iter()
                    .filter_map(Value::as_i64)
                    .collect::<Vec<_>>();
                Self::explicit_users(user_ids.clone()).validate()?;
                Ok(Self::explicit_users(user_ids))
            }
            other => Err(AppError::ValidationError(format!(
                "unsupported recipient selector: {other}"
            ))),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NotificationTemplate {
    pub id: i64,
    pub tenant_id: i64,
    pub code: String,
    pub name: String,
    pub event_code: Option<String>,
    pub locale: String,
    pub title_template: String,
    pub body_template: String,
    pub action_url_template: Option<String>,
    pub status: i16,
    pub created_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl NotificationTemplate {
    pub fn new(cmd: CreateNotificationTemplateCmd) -> AppResult<Self> {
        cmd.validate()?;
        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            code: cmd.code.trim().to_string(),
            name: cmd.name.trim().to_string(),
            event_code: trim_optional_string(cmd.event_code),
            locale: cmd.locale.trim().to_string(),
            title_template: cmd.title_template.trim().to_string(),
            body_template: cmd.body_template.trim().to_string(),
            action_url_template: trim_optional_string(cmd.action_url_template),
            status: cmd.status,
            created_by: cmd.created_by,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateNotificationTemplateCmd) -> AppResult<()> {
        cmd.validate()?;
        self.code = cmd.code.trim().to_string();
        self.name = cmd.name.trim().to_string();
        self.event_code = trim_optional_string(cmd.event_code);
        self.locale = cmd.locale.trim().to_string();
        self.title_template = cmd.title_template.trim().to_string();
        self.body_template = cmd.body_template.trim().to_string();
        self.action_url_template = trim_optional_string(cmd.action_url_template);
        self.status = cmd.status;
        self.updated_at = Utc::now();
        Ok(())
    }

    pub fn is_enabled(&self) -> bool {
        self.status == 1
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NotificationRule {
    pub id: i64,
    pub tenant_id: i64,
    pub name: String,
    pub event_code: Option<String>,
    pub template_id: i64,
    pub trigger_mode: String,
    pub timezone: String,
    pub delay_seconds: Option<i64>,
    pub schedule_kind: Option<String>,
    pub schedule_time: Option<String>,
    pub schedule_weekdays: Vec<i16>,
    pub cron_expression: Option<String>,
    pub next_run_at: Option<DateTime<Utc>>,
    pub last_run_at: Option<DateTime<Utc>>,
    pub last_fired_for: Option<DateTime<Utc>>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_at: Option<DateTime<Utc>>,
    pub catchup_policy: String,
    pub last_error: Option<String>,
    pub consecutive_failure_count: i32,
    pub recipient_selector_type: String,
    pub recipient_selector_payload: Value,
    pub enabled: bool,
    pub created_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub template_name: Option<String>,
    pub template_code: Option<String>,
}

impl NotificationRule {
    pub fn new(cmd: CreateNotificationRuleCmd) -> AppResult<Self> {
        cmd.validate()?;
        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            name: cmd.name.trim().to_string(),
            event_code: trim_optional_string(cmd.event_code),
            template_id: cmd.template_id,
            trigger_mode: cmd.trigger_mode.trim().to_string(),
            timezone: cmd.timezone.trim().to_string(),
            delay_seconds: cmd.delay_seconds,
            schedule_kind: trim_optional_string(cmd.schedule_kind),
            schedule_time: trim_optional_string(cmd.schedule_time),
            schedule_weekdays: cmd.schedule_weekdays,
            cron_expression: trim_optional_string(cmd.cron_expression),
            next_run_at: cmd.next_run_at,
            last_run_at: None,
            last_fired_for: None,
            start_at: cmd.start_at,
            end_at: cmd.end_at,
            catchup_policy: cmd.catchup_policy.trim().to_string(),
            last_error: None,
            consecutive_failure_count: 0,
            recipient_selector_type: cmd.recipient_selector.selector_type().to_string(),
            recipient_selector_payload: cmd.recipient_selector.to_payload(),
            enabled: cmd.enabled,
            created_by: cmd.created_by,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            template_name: None,
            template_code: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateNotificationRuleCmd) -> AppResult<()> {
        cmd.validate()?;
        self.name = cmd.name.trim().to_string();
        self.event_code = trim_optional_string(cmd.event_code);
        self.template_id = cmd.template_id;
        self.trigger_mode = cmd.trigger_mode.trim().to_string();
        self.timezone = cmd.timezone.trim().to_string();
        self.delay_seconds = cmd.delay_seconds;
        self.schedule_kind = trim_optional_string(cmd.schedule_kind);
        self.schedule_time = trim_optional_string(cmd.schedule_time);
        self.schedule_weekdays = cmd.schedule_weekdays;
        self.cron_expression = trim_optional_string(cmd.cron_expression);
        self.next_run_at = cmd.next_run_at;
        self.start_at = cmd.start_at;
        self.end_at = cmd.end_at;
        self.catchup_policy = cmd.catchup_policy.trim().to_string();
        self.last_error = None;
        self.consecutive_failure_count = 0;
        self.recipient_selector_type = cmd.recipient_selector.selector_type().to_string();
        self.recipient_selector_payload = cmd.recipient_selector.to_payload();
        self.enabled = cmd.enabled;
        self.updated_at = Utc::now();
        Ok(())
    }

    pub fn recipient_selector(&self) -> AppResult<NotificationRecipientSelector> {
        NotificationRecipientSelector::from_parts(
            self.recipient_selector_type.as_str(),
            &self.recipient_selector_payload,
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NotificationRuleFire {
    pub id: i64,
    pub tenant_id: i64,
    pub rule_id: i64,
    pub scheduled_at: DateTime<Utc>,
    pub fired_at: Option<DateTime<Utc>>,
    pub status: String,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NotificationDispatch {
    pub id: i64,
    pub tenant_id: i64,
    pub trigger_type: String,
    pub event_code: Option<String>,
    pub template_id: Option<i64>,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub recipient_selector_type: String,
    pub recipient_selector_payload: Value,
    pub payload: Value,
    pub recipient_count: i64,
    pub idempotency_key: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl NotificationDispatch {
    pub fn recipient_selector(&self) -> AppResult<NotificationRecipientSelector> {
        NotificationRecipientSelector::from_parts(
            self.recipient_selector_type.as_str(),
            &self.recipient_selector_payload,
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserNotification {
    pub id: i64,
    pub tenant_id: i64,
    pub dispatch_id: i64,
    pub user_id: i64,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub read_at: Option<DateTime<Utc>>,
    pub archived_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateNotificationTemplateCmd {
    pub id: i64,
    pub tenant_id: i64,
    pub code: String,
    pub name: String,
    pub event_code: Option<String>,
    pub locale: String,
    pub title_template: String,
    pub body_template: String,
    pub action_url_template: Option<String>,
    pub status: i16,
    pub created_by: Option<i64>,
}

impl CreateNotificationTemplateCmd {
    pub fn validate(&self) -> AppResult<()> {
        validate_non_empty(&self.code, "code", 80)?;
        validate_non_empty(&self.name, "name", 120)?;
        validate_non_empty(&self.locale, "locale", 16)?;
        validate_non_empty(&self.title_template, "title_template", 200)?;
        validate_non_empty(&self.body_template, "body_template", 20_000)?;
        validate_optional_length(&self.event_code, "event_code", 120)?;
        validate_optional_length(&self.action_url_template, "action_url_template", 500)?;
        validate_binary_status(self.status, "status")?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct UpdateNotificationTemplateCmd {
    pub code: String,
    pub name: String,
    pub event_code: Option<String>,
    pub locale: String,
    pub title_template: String,
    pub body_template: String,
    pub action_url_template: Option<String>,
    pub status: i16,
}

impl UpdateNotificationTemplateCmd {
    pub fn validate(&self) -> AppResult<()> {
        CreateNotificationTemplateCmd {
            id: 0,
            tenant_id: 0,
            code: self.code.clone(),
            name: self.name.clone(),
            event_code: self.event_code.clone(),
            locale: self.locale.clone(),
            title_template: self.title_template.clone(),
            body_template: self.body_template.clone(),
            action_url_template: self.action_url_template.clone(),
            status: self.status,
            created_by: None,
        }
        .validate()
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageNotificationTemplateCmd {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub event_code: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct CreateNotificationRuleCmd {
    pub id: i64,
    pub tenant_id: i64,
    pub name: String,
    pub event_code: Option<String>,
    pub template_id: i64,
    pub trigger_mode: String,
    pub timezone: String,
    pub delay_seconds: Option<i64>,
    pub schedule_kind: Option<String>,
    pub schedule_time: Option<String>,
    pub schedule_weekdays: Vec<i16>,
    pub cron_expression: Option<String>,
    pub next_run_at: Option<DateTime<Utc>>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_at: Option<DateTime<Utc>>,
    pub catchup_policy: String,
    pub recipient_selector: NotificationRecipientSelector,
    pub enabled: bool,
    pub created_by: Option<i64>,
}

impl CreateNotificationRuleCmd {
    pub fn validate(&self) -> AppResult<()> {
        validate_non_empty(&self.name, "name", 120)?;
        validate_non_empty(&self.trigger_mode, "trigger_mode", 32)?;
        validate_non_empty(&self.timezone, "timezone", 64)?;
        validate_non_empty(&self.catchup_policy, "catchup_policy", 32)?;
        validate_optional_length(&self.event_code, "event_code", 120)?;
        validate_optional_length(&self.schedule_kind, "schedule_kind", 32)?;
        validate_optional_length(&self.schedule_time, "schedule_time", 5)?;
        validate_optional_length(&self.cron_expression, "cron_expression", 120)?;
        validate_optional_schedule_weekdays(&self.schedule_weekdays)?;
        validate_optional_schedule_time(&self.schedule_time)?;
        validate_rule_trigger_fields(self)?;
        self.recipient_selector.validate()?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct UpdateNotificationRuleCmd {
    pub name: String,
    pub event_code: Option<String>,
    pub template_id: i64,
    pub trigger_mode: String,
    pub timezone: String,
    pub delay_seconds: Option<i64>,
    pub schedule_kind: Option<String>,
    pub schedule_time: Option<String>,
    pub schedule_weekdays: Vec<i16>,
    pub cron_expression: Option<String>,
    pub next_run_at: Option<DateTime<Utc>>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_at: Option<DateTime<Utc>>,
    pub catchup_policy: String,
    pub recipient_selector: NotificationRecipientSelector,
    pub enabled: bool,
}

impl UpdateNotificationRuleCmd {
    pub fn validate(&self) -> AppResult<()> {
        CreateNotificationRuleCmd {
            id: 0,
            tenant_id: 0,
            name: self.name.clone(),
            event_code: self.event_code.clone(),
            template_id: self.template_id,
            trigger_mode: self.trigger_mode.clone(),
            timezone: self.timezone.clone(),
            delay_seconds: self.delay_seconds,
            schedule_kind: self.schedule_kind.clone(),
            schedule_time: self.schedule_time.clone(),
            schedule_weekdays: self.schedule_weekdays.clone(),
            cron_expression: self.cron_expression.clone(),
            next_run_at: self.next_run_at,
            start_at: self.start_at,
            end_at: self.end_at,
            catchup_policy: self.catchup_policy.clone(),
            recipient_selector: self.recipient_selector.clone(),
            enabled: self.enabled,
            created_by: None,
        }
        .validate()
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageNotificationRuleCmd {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub event_code: Option<String>,
    pub enabled: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct PublishNotificationCmd {
    pub tenant_id: i64,
    pub trigger_type: Option<String>,
    pub template_id: Option<i64>,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub recipient_selector: NotificationRecipientSelector,
    pub payload: Value,
    pub idempotency_key: Option<String>,
    pub created_by: Option<i64>,
}

impl PublishNotificationCmd {
    pub fn validate(&self) -> AppResult<()> {
        validate_non_empty(&self.title, "title", 200)?;
        validate_non_empty(&self.body, "body", 20_000)?;
        validate_optional_length(&self.action_url, "action_url", 500)?;
        validate_optional_length(&self.idempotency_key, "idempotency_key", 160)?;
        if let Some(trigger_type) = self.trigger_type.as_ref() {
            match trigger_type.trim() {
                NOTIFICATION_TRIGGER_MANUAL | NOTIFICATION_TRIGGER_DIRECT => {}
                other => {
                    return Err(AppError::ValidationError(format!(
                        "unsupported publish trigger_type: {other}"
                    )));
                }
            }
        }
        self.recipient_selector.validate()?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct NotificationEvent {
    pub tenant_id: i64,
    pub event_code: String,
    pub actor_user_id: Option<i64>,
    pub source_type: Option<String>,
    pub source_id: Option<i64>,
    pub template_vars: Value,
    pub idempotency_key: Option<String>,
    pub created_by: Option<i64>,
}

impl NotificationEvent {
    pub fn validate(&self) -> AppResult<()> {
        validate_non_empty(&self.event_code, "event_code", 120)?;
        validate_optional_length(&self.idempotency_key, "idempotency_key", 160)?;
        validate_optional_length(&self.source_type, "source_type", 120)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageNotificationDispatchCmd {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub trigger_type: Option<String>,
    pub event_code: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct PageUserNotificationCmd {
    pub tenant_id: i64,
    pub user_id: i64,
    pub unread_only: Option<bool>,
    pub archived: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct NotificationStreamSignal {
    pub tenant_id: i64,
    pub user_id: i64,
    pub reason: String,
    pub unread_count: i64,
    pub notification: Option<UserNotification>,
}

#[derive(Debug, Clone, Default)]
pub struct NotificationTemplatePageQuery {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub event_code: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct NotificationRulePageQuery {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub event_code: Option<String>,
    pub enabled: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct NotificationDispatchPageQuery {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub trigger_type: Option<String>,
    pub event_code: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct UserNotificationPageQuery {
    pub tenant_id: i64,
    pub user_id: i64,
    pub unread_only: Option<bool>,
    pub archived: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

fn validate_non_empty(value: &str, field: &str, max_len: usize) -> AppResult<()> {
    let value = value.trim();
    if value.is_empty() {
        return Err(AppError::ValidationError(format!(
            "{field} cannot be empty"
        )));
    }
    if value.len() > max_len {
        return Err(AppError::ValidationError(format!(
            "{field} length must be <= {max_len}"
        )));
    }
    Ok(())
}

fn validate_optional_length(value: &Option<String>, field: &str, max_len: usize) -> AppResult<()> {
    if let Some(value) = value
        .as_ref()
        .map(|item| item.trim())
        .filter(|item| !item.is_empty())
    {
        if value.len() > max_len {
            return Err(AppError::ValidationError(format!(
                "{field} length must be <= {max_len}"
            )));
        }
    }
    Ok(())
}

fn validate_binary_status(value: i16, field: &str) -> AppResult<()> {
    match value {
        0 | 1 => Ok(()),
        _ => Err(AppError::ValidationError(format!(
            "{field} must be either 0 or 1"
        ))),
    }
}

fn trim_optional_string(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim();
        (!trimmed.is_empty()).then(|| trimmed.to_string())
    })
}

fn validate_optional_schedule_time(value: &Option<String>) -> AppResult<()> {
    if let Some(value) = value
        .as_ref()
        .map(|item| item.trim())
        .filter(|item| !item.is_empty())
    {
        NaiveTime::parse_from_str(value, "%H:%M").map_err(|_| {
            AppError::ValidationError("schedule_time must use HH:MM format".to_string())
        })?;
    }
    Ok(())
}

fn validate_optional_schedule_weekdays(value: &[i16]) -> AppResult<()> {
    if value.iter().any(|day| !(1..=7).contains(day)) {
        return Err(AppError::ValidationError(
            "schedule_weekdays must contain values from 1 to 7".to_string(),
        ));
    }
    Ok(())
}

fn validate_rule_trigger_fields(cmd: &CreateNotificationRuleCmd) -> AppResult<()> {
    let trigger_mode = cmd.trigger_mode.trim();
    if trigger_mode != NOTIFICATION_TRIGGER_EVENT
        && matches!(cmd.recipient_selector, NotificationRecipientSelector::Actor)
    {
        return Err(AppError::ValidationError(
            "actor recipient selector is only supported for event trigger mode".to_string(),
        ));
    }

    match trigger_mode {
        NOTIFICATION_TRIGGER_EVENT => {
            if cmd
                .event_code
                .as_ref()
                .map(|value| value.trim().is_empty())
                .unwrap_or(true)
            {
                return Err(AppError::ValidationError(
                    "event_code is required for event trigger mode".to_string(),
                ));
            }
        }
        NOTIFICATION_TRIGGER_DELAY_ONCE => {
            if cmd.delay_seconds.unwrap_or_default() <= 0 {
                return Err(AppError::ValidationError(
                    "delay_seconds must be > 0 for delay_once trigger mode".to_string(),
                ));
            }
        }
        NOTIFICATION_TRIGGER_FIXED_SCHEDULE => {
            let kind = cmd
                .schedule_kind
                .as_ref()
                .map(|value| value.trim())
                .filter(|value| !value.is_empty())
                .ok_or_else(|| {
                    AppError::ValidationError(
                        "schedule_kind is required for fixed_schedule trigger mode".to_string(),
                    )
                })?;
            if cmd
                .schedule_time
                .as_ref()
                .map(|value| value.trim().is_empty())
                .unwrap_or(true)
            {
                return Err(AppError::ValidationError(
                    "schedule_time is required for fixed_schedule trigger mode".to_string(),
                ));
            }
            match kind {
                NOTIFICATION_SCHEDULE_DAILY => {}
                NOTIFICATION_SCHEDULE_WEEKLY => {
                    if cmd.schedule_weekdays.is_empty() {
                        return Err(AppError::ValidationError(
                            "schedule_weekdays is required for weekly fixed_schedule".to_string(),
                        ));
                    }
                }
                other => {
                    return Err(AppError::ValidationError(format!(
                        "unsupported schedule_kind for fixed_schedule: {other}"
                    )));
                }
            }
        }
        NOTIFICATION_TRIGGER_CRON_EXPRESSION => {
            if cmd
                .cron_expression
                .as_ref()
                .map(|value| value.trim().is_empty())
                .unwrap_or(true)
            {
                return Err(AppError::ValidationError(
                    "cron_expression is required for cron_expression trigger mode".to_string(),
                ));
            }
        }
        other => {
            return Err(AppError::ValidationError(format!(
                "unsupported trigger_mode: {other}"
            )));
        }
    }

    Ok(())
}
