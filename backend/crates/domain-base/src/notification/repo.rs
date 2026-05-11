use chrono::{DateTime, Utc};
use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    NotificationDispatch, NotificationRecipientSelector, NotificationRule, NotificationRuleFire,
    NotificationTemplate, UserNotification,
    notification::{
        NotificationDispatchPageQuery, NotificationRulePageQuery, NotificationTemplatePageQuery,
        UserNotificationPageQuery,
    },
};

#[async_trait]
pub trait NotificationRepository: Send + Sync {
    async fn create_template(
        &self,
        template: &NotificationTemplate,
    ) -> AppResult<NotificationTemplate>;
    async fn find_template_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> AppResult<Option<NotificationTemplate>>;
    async fn find_template_by_code(
        &self,
        tenant_id: i64,
        code: &str,
        locale: &str,
    ) -> AppResult<Option<NotificationTemplate>>;
    async fn page_templates(
        &self,
        query: &NotificationTemplatePageQuery,
    ) -> AppResult<(Vec<NotificationTemplate>, i64)>;
    async fn update_template(
        &self,
        template: &NotificationTemplate,
    ) -> AppResult<NotificationTemplate>;

    async fn create_rule(&self, rule: &NotificationRule) -> AppResult<NotificationRule>;
    async fn find_rule_by_id(&self, tenant_id: i64, id: i64)
    -> AppResult<Option<NotificationRule>>;
    async fn page_rules(
        &self,
        query: &NotificationRulePageQuery,
    ) -> AppResult<(Vec<NotificationRule>, i64)>;
    async fn list_enabled_rules_by_event(
        &self,
        tenant_id: i64,
        event_code: &str,
    ) -> AppResult<Vec<NotificationRule>>;
    async fn list_enabled_time_rules(&self) -> AppResult<Vec<NotificationRule>>;
    async fn update_rule(&self, rule: &NotificationRule) -> AppResult<NotificationRule>;
    async fn update_rule_schedule_state(
        &self,
        tenant_id: i64,
        id: i64,
        next_run_at: Option<DateTime<Utc>>,
        fired_at: Option<DateTime<Utc>>,
        fired_for: Option<DateTime<Utc>>,
        last_error: Option<String>,
        consecutive_failure_count: i32,
    ) -> AppResult<()>;
    async fn upsert_rule_fire(
        &self,
        fire: &NotificationRuleFire,
    ) -> AppResult<NotificationRuleFire>;

    async fn find_dispatch_by_idempotency_key(
        &self,
        tenant_id: i64,
        idempotency_key: &str,
    ) -> AppResult<Option<NotificationDispatch>>;
    async fn create_dispatch(
        &self,
        dispatch: &NotificationDispatch,
        recipient_user_ids: &[i64],
    ) -> AppResult<(NotificationDispatch, Vec<UserNotification>)>;
    async fn page_dispatches(
        &self,
        query: &NotificationDispatchPageQuery,
    ) -> AppResult<(Vec<NotificationDispatch>, i64)>;

    async fn page_user_notifications(
        &self,
        query: &UserNotificationPageQuery,
    ) -> AppResult<(Vec<UserNotification>, i64)>;
    async fn unread_count(&self, tenant_id: i64, user_id: i64) -> AppResult<i64>;
    async fn mark_read(&self, tenant_id: i64, user_id: i64, ids: &[i64]) -> AppResult<()>;
    async fn mark_all_read(&self, tenant_id: i64, user_id: i64) -> AppResult<()>;
    async fn archive(&self, tenant_id: i64, user_id: i64, ids: &[i64]) -> AppResult<()>;
    async fn resolve_recipient_user_ids(
        &self,
        tenant_id: i64,
        selector: &NotificationRecipientSelector,
        actor_user_id: Option<i64>,
    ) -> AppResult<Vec<i64>>;
}
