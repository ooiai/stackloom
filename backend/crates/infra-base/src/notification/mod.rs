pub mod repo;
pub mod service;

pub use repo::SqlxNotificationRepository;
pub use service::NotificationServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::{NotificationDispatch, NotificationRule, NotificationTemplate, UserNotification};
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
    pub event_code: String,
    pub template_id: i64,
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
