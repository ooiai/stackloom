use domain_base::{
    NotificationDispatch, NotificationRecipientSelector, NotificationRule, NotificationTemplate,
};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct NotificationDispatchResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub trigger_type: String,
    pub event_code: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub template_id: Option<i64>,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub recipient_selector_type: String,
    #[serde(serialize_with = "serde_helpers::serialize_vec_option_i64")]
    pub recipient_user_ids: Option<Vec<i64>>,
    pub recipient_count: i64,
    pub created_at: DateTime<Utc>,
}

impl From<NotificationDispatch> for NotificationDispatchResp {
    fn from(value: NotificationDispatch) -> Self {
        let recipient_user_ids = value.recipient_selector().ok().and_then(selector_to_ids);

        Self {
            id: value.id,
            trigger_type: value.trigger_type,
            event_code: value.event_code,
            template_id: value.template_id,
            title: value.title,
            body: value.body,
            action_url: value.action_url,
            recipient_selector_type: value.recipient_selector_type,
            recipient_user_ids,
            recipient_count: value.recipient_count,
            created_at: value.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateNotificationDispatchResp {
    pub items: Vec<NotificationDispatchResp>,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct NotificationTemplateResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub code: String,
    pub name: String,
    pub event_code: Option<String>,
    pub locale: String,
    pub title_template: String,
    pub body_template: String,
    pub action_url_template: Option<String>,
    pub status: i16,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<NotificationTemplate> for NotificationTemplateResp {
    fn from(value: NotificationTemplate) -> Self {
        Self {
            id: value.id,
            code: value.code,
            name: value.name,
            event_code: value.event_code,
            locale: value.locale,
            title_template: value.title_template,
            body_template: value.body_template,
            action_url_template: value.action_url_template,
            status: value.status,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateNotificationTemplateResp {
    pub items: Vec<NotificationTemplateResp>,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct NotificationRuleResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub name: String,
    pub event_code: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
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
    pub template_name: Option<String>,
    pub template_code: Option<String>,
    pub recipient_selector_type: String,
    #[serde(serialize_with = "serde_helpers::serialize_vec_option_i64")]
    pub recipient_user_ids: Option<Vec<i64>>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<NotificationRule> for NotificationRuleResp {
    fn from(value: NotificationRule) -> Self {
        let recipient_user_ids = value.recipient_selector().ok().and_then(selector_to_ids);

        Self {
            id: value.id,
            name: value.name,
            event_code: value.event_code,
            template_id: value.template_id,
            trigger_mode: value.trigger_mode,
            timezone: value.timezone,
            delay_seconds: value.delay_seconds,
            schedule_kind: value.schedule_kind,
            schedule_time: value.schedule_time,
            schedule_weekdays: value.schedule_weekdays,
            cron_expression: value.cron_expression,
            next_run_at: value.next_run_at,
            last_run_at: value.last_run_at,
            last_fired_for: value.last_fired_for,
            start_at: value.start_at,
            end_at: value.end_at,
            catchup_policy: value.catchup_policy,
            last_error: value.last_error,
            consecutive_failure_count: value.consecutive_failure_count,
            template_name: value.template_name,
            template_code: value.template_code,
            recipient_selector_type: value.recipient_selector_type,
            recipient_user_ids,
            enabled: value.enabled,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateNotificationRuleResp {
    pub items: Vec<NotificationRuleResp>,
    pub total: usize,
}

fn selector_to_ids(selector: NotificationRecipientSelector) -> Option<Vec<i64>> {
    match selector {
        NotificationRecipientSelector::ExplicitUsers(user_ids) => Some(user_ids),
        _ => None,
    }
}
