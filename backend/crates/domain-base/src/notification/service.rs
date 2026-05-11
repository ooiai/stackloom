//! Notification application service contract.
//!
//! # Usage
//!
//! Programmatic integration should prefer one of these two entry points:
//!
//! 1. `publish(cmd)` when the caller already knows the final title/body/recipient set
//! 2. `publish_event(event)` when the caller only emits a business event and wants
//!    tenant-configured templates + rules to decide how notifications are generated
//!
//! Prefer `publish_event` for new business modules so template text, recipient policy,
//! and enable/disable switches stay in notification management instead of being
//! hardcoded in every feature.
//!
//! ## Direct publish
//!
//! Use direct publish for one-off in-app notifications where the business flow
//! already has the final content.
//!
//! ```rust,ignore
//! use domain_base::{
//!     NotificationRecipientSelector, NotificationService, PublishNotificationCmd,
//! };
//! use neocrates::serde_json::json;
//!
//! notification_service
//!     .publish(PublishNotificationCmd {
//!         tenant_id,
//!         trigger_type: None, // defaults to "direct"
//!         title: "审批已通过".to_string(),
//!         body: "你提交的申请已经通过审批".to_string(),
//!         action_url: Some("/approvals".to_string()),
//!         recipient_selector: NotificationRecipientSelector::explicit_users(vec![user_id]),
//!         payload: json!({
//!             "biz_type": "approval",
//!             "biz_id": approval_id,
//!         }),
//!         idempotency_key: Some(format!("approval.passed:{approval_id}:{user_id}")),
//!         created_by: Some(operator_user_id),
//!     })
//!     .await?;
//! ```
//!
//! ## Event publish
//!
//! Use event publish when the business module should only emit a domain event.
//! Notification templates and rules will be resolved by `event_code`.
//!
//! ```rust,ignore
//! use domain_base::{NotificationEvent, NotificationService};
//! use neocrates::serde_json::json;
//!
//! notification_service
//!     .publish_event(NotificationEvent {
//!         tenant_id,
//!         event_code: "member.joined".to_string(),
//!         actor_user_id: Some(user_id),
//!         source_type: Some("member".to_string()),
//!         source_id: Some(user_id),
//!         template_vars: json!({
//!             "member": {
//!                 "id": user_id,
//!                 "username": username,
//!                 "nickname": nickname,
//!             },
//!             "tenant": {
//!                 "id": tenant_id,
//!                 "name": tenant_name,
//!             },
//!         }),
//!         idempotency_key: Some(format!("member.joined:{tenant_id}:{user_id}")),
//!         created_by: Some(user_id),
//!     })
//!     .await?;
//! ```
//!
//! ## Integration rules
//!
//! - Always pass the real `tenant_id`; notification data is tenant-scoped.
//! - When a rule uses the `actor` selector, `actor_user_id` must be present.
//! - `template_vars` keys should match template placeholders such as
//!   `{{member.username}}` and `{{tenant.name}}`.
//! - For retryable or deduplicated business actions, set `idempotency_key`.
//! - If notification failure must not block the primary business action, emit it
//!   asynchronously after the main write succeeds, like the current `member.joined`
//!   flow in `api-http/src/web/join/handlers.rs`.
//!
use neocrates::{async_trait::async_trait, response::error::AppResult, tokio::sync::broadcast};

use crate::{
    CreateNotificationRuleCmd, CreateNotificationTemplateCmd, NotificationDispatch,
    NotificationEvent, NotificationStreamSignal, NotificationTemplate, PageNotificationDispatchCmd,
    PageNotificationRuleCmd, PageNotificationTemplateCmd, PageUserNotificationCmd,
    PublishNotificationCmd, UpdateNotificationRuleCmd, UpdateNotificationTemplateCmd,
    UserNotification,
};

#[async_trait]
pub trait NotificationService: Send + Sync {
    async fn create_template(
        &self,
        cmd: CreateNotificationTemplateCmd,
    ) -> AppResult<NotificationTemplate>;
    async fn update_template(
        &self,
        tenant_id: i64,
        id: i64,
        cmd: UpdateNotificationTemplateCmd,
    ) -> AppResult<NotificationTemplate>;
    async fn page_templates(
        &self,
        cmd: PageNotificationTemplateCmd,
    ) -> AppResult<(Vec<NotificationTemplate>, i64)>;

    async fn create_rule(
        &self,
        cmd: CreateNotificationRuleCmd,
    ) -> AppResult<crate::NotificationRule>;
    async fn update_rule(
        &self,
        tenant_id: i64,
        id: i64,
        cmd: UpdateNotificationRuleCmd,
    ) -> AppResult<crate::NotificationRule>;
    async fn page_rules(
        &self,
        cmd: PageNotificationRuleCmd,
    ) -> AppResult<(Vec<crate::NotificationRule>, i64)>;

    async fn publish(&self, cmd: PublishNotificationCmd) -> AppResult<NotificationDispatch>;
    async fn publish_event(&self, event: NotificationEvent) -> AppResult<usize>;
    async fn page_dispatches(
        &self,
        cmd: PageNotificationDispatchCmd,
    ) -> AppResult<(Vec<NotificationDispatch>, i64)>;

    async fn page_user_notifications(
        &self,
        cmd: PageUserNotificationCmd,
    ) -> AppResult<(Vec<UserNotification>, i64)>;
    async fn unread_count(&self, tenant_id: i64, user_id: i64) -> AppResult<i64>;
    async fn mark_read(&self, tenant_id: i64, user_id: i64, ids: Vec<i64>) -> AppResult<()>;
    async fn mark_all_read(&self, tenant_id: i64, user_id: i64) -> AppResult<()>;
    async fn archive(&self, tenant_id: i64, user_id: i64, ids: Vec<i64>) -> AppResult<()>;

    fn subscribe(&self) -> broadcast::Receiver<NotificationStreamSignal>;
}
