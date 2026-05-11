pub mod repo;
pub mod service;

pub use repo::SqlxNotificationRepository;
pub use service::NotificationServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::{
    NotificationDispatch, NotificationRule, NotificationRuleFire, NotificationTemplate,
    UserNotification,
};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct NotificationTemplateRow {
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

impl From<NotificationTemplateRow> for NotificationTemplate {
    fn from(row: NotificationTemplateRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            code: row.code,
            name: row.name,
            event_code: row.event_code,
            locale: row.locale,
            title_template: row.title_template,
            body_template: row.body_template,
            action_url_template: row.action_url_template,
            status: row.status,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct NotificationRuleRow {
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
    pub schedule_weekdays: sqlx::types::Json<Vec<i16>>,
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
    pub recipient_selector_payload: sqlx::types::Json<neocrates::serde_json::Value>,
    pub enabled: bool,
    pub created_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub template_name: Option<String>,
    pub template_code: Option<String>,
}

impl From<NotificationRuleRow> for NotificationRule {
    fn from(row: NotificationRuleRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            event_code: row.event_code,
            template_id: row.template_id,
            trigger_mode: row.trigger_mode,
            timezone: row.timezone,
            delay_seconds: row.delay_seconds,
            schedule_kind: row.schedule_kind,
            schedule_time: row.schedule_time,
            schedule_weekdays: row.schedule_weekdays.0,
            cron_expression: row.cron_expression,
            next_run_at: row.next_run_at,
            last_run_at: row.last_run_at,
            last_fired_for: row.last_fired_for,
            start_at: row.start_at,
            end_at: row.end_at,
            catchup_policy: row.catchup_policy,
            last_error: row.last_error,
            consecutive_failure_count: row.consecutive_failure_count,
            recipient_selector_type: row.recipient_selector_type,
            recipient_selector_payload: row.recipient_selector_payload.0,
            enabled: row.enabled,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            template_name: row.template_name,
            template_code: row.template_code,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct NotificationRuleFireRow {
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

impl From<NotificationRuleFireRow> for NotificationRuleFire {
    fn from(row: NotificationRuleFireRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            rule_id: row.rule_id,
            scheduled_at: row.scheduled_at,
            fired_at: row.fired_at,
            status: row.status,
            error_message: row.error_message,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct NotificationDispatchRow {
    pub id: i64,
    pub tenant_id: i64,
    pub trigger_type: String,
    pub event_code: Option<String>,
    pub template_id: Option<i64>,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub recipient_selector_type: String,
    pub recipient_selector_payload: sqlx::types::Json<neocrates::serde_json::Value>,
    pub payload: sqlx::types::Json<neocrates::serde_json::Value>,
    pub recipient_count: i64,
    pub idempotency_key: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<NotificationDispatchRow> for NotificationDispatch {
    fn from(row: NotificationDispatchRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            trigger_type: row.trigger_type,
            event_code: row.event_code,
            template_id: row.template_id,
            title: row.title,
            body: row.body,
            action_url: row.action_url,
            recipient_selector_type: row.recipient_selector_type,
            recipient_selector_payload: row.recipient_selector_payload.0,
            payload: row.payload.0,
            recipient_count: row.recipient_count,
            idempotency_key: row.idempotency_key,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct UserNotificationRow {
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

impl From<UserNotificationRow> for UserNotification {
    fn from(row: UserNotificationRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            dispatch_id: row.dispatch_id,
            user_id: row.user_id,
            title: row.title,
            body: row.body,
            action_url: row.action_url,
            read_at: row.read_at,
            archived_at: row.archived_at,
            created_at: row.created_at,
        }
    }
}
