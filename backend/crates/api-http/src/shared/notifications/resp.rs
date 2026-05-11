use domain_base::{NotificationStreamSignal, UserNotification};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct UserNotificationResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub dispatch_id: i64,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub read_at: Option<DateTime<Utc>>,
    pub archived_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<UserNotification> for UserNotificationResp {
    fn from(value: UserNotification) -> Self {
        Self {
            id: value.id,
            dispatch_id: value.dispatch_id,
            title: value.title,
            body: value.body,
            action_url: value.action_url,
            read_at: value.read_at,
            archived_at: value.archived_at,
            created_at: value.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateUserNotificationResp {
    pub items: Vec<UserNotificationResp>,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct NotificationUnreadCountResp {
    pub count: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct NotificationStreamResp {
    pub reason: String,
    pub unread_count: i64,
    pub notification: Option<UserNotificationResp>,
}

impl From<NotificationStreamSignal> for NotificationStreamResp {
    fn from(value: NotificationStreamSignal) -> Self {
        Self {
            reason: value.reason,
            unread_count: value.unread_count,
            notification: value.notification.map(UserNotificationResp::from),
        }
    }
}
