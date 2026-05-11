use std::sync::Arc;

use common::core::biz_error::{
    NOTIFICATION_EVENT_ACTOR_REQUIRED, NOTIFICATION_RECIPIENT_EMPTY,
    NOTIFICATION_TEMPLATE_CODE_EXISTS,
};
use domain_base::{
    CreateNotificationRuleCmd, CreateNotificationTemplateCmd, NotificationDispatch,
    NotificationEvent, NotificationRecipientSelector, NotificationRepository, NotificationRule,
    NotificationService, NotificationStreamSignal, NotificationTemplate,
    PageNotificationDispatchCmd, PageNotificationRuleCmd, PageNotificationTemplateCmd,
    PageUserNotificationCmd, PublishNotificationCmd, UpdateNotificationRuleCmd,
    UpdateNotificationTemplateCmd, UserNotification,
    notification::{
        NOTIFICATION_STREAM_REASON_CREATED, NOTIFICATION_STREAM_REASON_REFRESH,
        NOTIFICATION_TRIGGER_DIRECT, NOTIFICATION_TRIGGER_EVENT, NotificationDispatchPageQuery,
        NotificationRulePageQuery, NotificationTemplatePageQuery, UserNotificationPageQuery,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    serde_json::{Value, json},
    sqlxhelper::pool::SqlxPool,
    tokio::sync::broadcast,
    tracing,
};

use super::repo::SqlxNotificationRepository;

#[derive(Clone)]
pub struct NotificationServiceImpl<R>
where
    R: NotificationRepository,
{
    repository: Arc<R>,
    broadcaster: broadcast::Sender<NotificationStreamSignal>,
}

impl NotificationServiceImpl<SqlxNotificationRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        let (broadcaster, _) = broadcast::channel(256);
        Self {
            repository: Arc::new(SqlxNotificationRepository::new(pool)),
            broadcaster,
        }
    }
}

impl<R> NotificationServiceImpl<R>
where
    R: NotificationRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        let (broadcaster, _) = broadcast::channel(256);
        Self {
            repository,
            broadcaster,
        }
    }

    fn build_dispatch(
        &self,
        tenant_id: i64,
        trigger_type: &str,
        event_code: Option<String>,
        template_id: Option<i64>,
        title: String,
        body: String,
        action_url: Option<String>,
        recipient_selector: NotificationRecipientSelector,
        payload: Value,
        idempotency_key: Option<String>,
        created_by: Option<i64>,
        recipient_count: usize,
    ) -> NotificationDispatch {
        let now = chrono::Utc::now();
        NotificationDispatch {
            id: generate_sonyflake_id() as i64,
            tenant_id,
            trigger_type: trigger_type.to_string(),
            event_code,
            template_id,
            title,
            body,
            action_url: trim_optional_string(action_url),
            recipient_selector_type: recipient_selector.selector_type().to_string(),
            recipient_selector_payload: recipient_selector.to_payload(),
            payload: normalize_payload(payload),
            recipient_count: recipient_count as i64,
            idempotency_key: trim_optional_string(idempotency_key),
            created_by,
            created_at: now,
            updated_at: now,
        }
    }

    async fn publish_internal(
        &self,
        trigger_type: &str,
        template_id: Option<i64>,
        event_code: Option<String>,
        cmd: PublishNotificationCmd,
    ) -> AppResult<NotificationDispatch> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(idempotency_key) = cmd.idempotency_key.as_deref() {
            if let Some(existing) = self
                .repository
                .find_dispatch_by_idempotency_key(cmd.tenant_id, idempotency_key)
                .await?
            {
                return Ok(existing);
            }
        }

        let recipient_user_ids = self
            .repository
            .resolve_recipient_user_ids(cmd.tenant_id, &cmd.recipient_selector, cmd.created_by)
            .await?;

        if recipient_user_ids.is_empty() {
            return Err(AppError::DataError(
                NOTIFICATION_RECIPIENT_EMPTY,
                "notification has no eligible recipients".to_string(),
            ));
        }

        let dispatch = self.build_dispatch(
            cmd.tenant_id,
            trigger_type,
            event_code,
            template_id,
            cmd.title,
            cmd.body,
            cmd.action_url,
            cmd.recipient_selector,
            cmd.payload,
            cmd.idempotency_key,
            cmd.created_by,
            recipient_user_ids.len(),
        );

        let (dispatch, notifications) = self
            .repository
            .create_dispatch(&dispatch, &recipient_user_ids)
            .await?;
        self.emit_created_signals(notifications).await;

        Ok(dispatch)
    }

    async fn emit_created_signals(&self, notifications: Vec<UserNotification>) {
        for notification in notifications {
            match self
                .repository
                .unread_count(notification.tenant_id, notification.user_id)
                .await
            {
                Ok(unread_count) => {
                    let _ = self.broadcaster.send(NotificationStreamSignal {
                        tenant_id: notification.tenant_id,
                        user_id: notification.user_id,
                        reason: NOTIFICATION_STREAM_REASON_CREATED.to_string(),
                        unread_count,
                        notification: Some(notification),
                    });
                }
                Err(err) => {
                    tracing::warn!(
                        tenant_id = notification.tenant_id,
                        user_id = notification.user_id,
                        error = %err,
                        "failed to load unread_count after notification creation"
                    );
                }
            }
        }
    }

    async fn emit_refresh_signal(&self, tenant_id: i64, user_id: i64) {
        match self.repository.unread_count(tenant_id, user_id).await {
            Ok(unread_count) => {
                let _ = self.broadcaster.send(NotificationStreamSignal {
                    tenant_id,
                    user_id,
                    reason: NOTIFICATION_STREAM_REASON_REFRESH.to_string(),
                    unread_count,
                    notification: None,
                });
            }
            Err(err) => {
                tracing::warn!(
                    tenant_id,
                    user_id,
                    error = %err,
                    "failed to load unread_count after notification refresh"
                );
            }
        }
    }

    async fn load_template_or_skip(
        &self,
        tenant_id: i64,
        rule: &NotificationRule,
    ) -> AppResult<Option<NotificationTemplate>> {
        let Some(template) = self
            .repository
            .find_template_by_id(tenant_id, rule.template_id)
            .await?
        else {
            tracing::warn!(
                tenant_id,
                rule_id = rule.id,
                template_id = rule.template_id,
                "notification rule template not found, skipping event publish"
            );
            return Ok(None);
        };

        if !template.is_enabled() {
            tracing::warn!(
                tenant_id,
                rule_id = rule.id,
                template_id = rule.template_id,
                "notification template disabled, skipping event publish"
            );
            return Ok(None);
        }

        Ok(Some(template))
    }
}

#[async_trait]
impl<R> NotificationService for NotificationServiceImpl<R>
where
    R: NotificationRepository,
{
    async fn create_template(
        &self,
        mut cmd: CreateNotificationTemplateCmd,
    ) -> AppResult<NotificationTemplate> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if self
            .repository
            .find_template_by_code(cmd.tenant_id, cmd.code.trim(), cmd.locale.trim())
            .await?
            .is_some()
        {
            return Err(AppError::DataError(
                NOTIFICATION_TEMPLATE_CODE_EXISTS,
                "notification template code already exists".to_string(),
            ));
        }

        cmd.id = generate_sonyflake_id() as i64;
        let template = NotificationTemplate::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.create_template(&template).await
    }

    async fn update_template(
        &self,
        tenant_id: i64,
        id: i64,
        cmd: UpdateNotificationTemplateCmd,
    ) -> AppResult<NotificationTemplate> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut template = self
            .repository
            .find_template_by_id(tenant_id, id)
            .await?
            .ok_or_else(|| {
                AppError::not_found_here(format!("notification template not found: {id}"))
            })?;

        if let Some(existing) = self
            .repository
            .find_template_by_code(tenant_id, cmd.code.trim(), cmd.locale.trim())
            .await?
        {
            if existing.id != id {
                return Err(AppError::DataError(
                    NOTIFICATION_TEMPLATE_CODE_EXISTS,
                    "notification template code already exists".to_string(),
                ));
            }
        }

        template
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.update_template(&template).await
    }

    async fn page_templates(
        &self,
        cmd: PageNotificationTemplateCmd,
    ) -> AppResult<(Vec<NotificationTemplate>, i64)> {
        self.repository
            .page_templates(&NotificationTemplatePageQuery {
                tenant_id: cmd.tenant_id,
                keyword: cmd.keyword,
                event_code: cmd.event_code,
                status: cmd.status,
                limit: cmd.limit,
                offset: cmd.offset,
            })
            .await
    }

    async fn create_rule(&self, mut cmd: CreateNotificationRuleCmd) -> AppResult<NotificationRule> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository
            .find_template_by_id(cmd.tenant_id, cmd.template_id)
            .await?
            .ok_or_else(|| {
                AppError::not_found_here(format!(
                    "notification template not found: {}",
                    cmd.template_id
                ))
            })?;

        cmd.id = generate_sonyflake_id() as i64;
        let rule =
            NotificationRule::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.create_rule(&rule).await
    }

    async fn update_rule(
        &self,
        tenant_id: i64,
        id: i64,
        cmd: UpdateNotificationRuleCmd,
    ) -> AppResult<NotificationRule> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository
            .find_template_by_id(tenant_id, cmd.template_id)
            .await?
            .ok_or_else(|| {
                AppError::not_found_here(format!(
                    "notification template not found: {}",
                    cmd.template_id
                ))
            })?;

        let mut rule = self
            .repository
            .find_rule_by_id(tenant_id, id)
            .await?
            .ok_or_else(|| {
                AppError::not_found_here(format!("notification rule not found: {id}"))
            })?;

        rule.apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.repository.update_rule(&rule).await
    }

    async fn page_rules(
        &self,
        cmd: PageNotificationRuleCmd,
    ) -> AppResult<(Vec<NotificationRule>, i64)> {
        self.repository
            .page_rules(&NotificationRulePageQuery {
                tenant_id: cmd.tenant_id,
                keyword: cmd.keyword,
                event_code: cmd.event_code,
                enabled: cmd.enabled,
                limit: cmd.limit,
                offset: cmd.offset,
            })
            .await
    }

    async fn publish(&self, cmd: PublishNotificationCmd) -> AppResult<NotificationDispatch> {
        let trigger_type = cmd
            .trigger_type
            .clone()
            .unwrap_or_else(|| NOTIFICATION_TRIGGER_DIRECT.to_string());
        self.publish_internal(trigger_type.as_str(), None, None, cmd)
            .await
    }

    async fn publish_event(&self, event: NotificationEvent) -> AppResult<usize> {
        event
            .validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let rules = self
            .repository
            .list_enabled_rules_by_event(event.tenant_id, event.event_code.trim())
            .await?;

        let mut published = 0usize;

        for rule in rules {
            let Some(template) = self.load_template_or_skip(event.tenant_id, &rule).await? else {
                continue;
            };

            let selector = match rule.recipient_selector() {
                Ok(selector) => selector,
                Err(err) => {
                    tracing::warn!(rule_id = rule.id, error = %err, "invalid notification rule selector");
                    continue;
                }
            };

            if matches!(selector, NotificationRecipientSelector::Actor)
                && event.actor_user_id.is_none()
            {
                tracing::warn!(
                    rule_id = rule.id,
                    event_code = event.event_code,
                    error_key = NOTIFICATION_EVENT_ACTOR_REQUIRED,
                    "actor-based notification rule skipped because event has no actor_user_id"
                );
                continue;
            }

            let title = render_template(&template.title_template, &event.template_vars);
            let body = render_template(&template.body_template, &event.template_vars);
            let action_url = template
                .action_url_template
                .as_ref()
                .map(|value| render_template(value, &event.template_vars));
            let idempotency_key = event
                .idempotency_key
                .as_ref()
                .map(|key| format!("{key}:{}", rule.id));

            let payload = json!({
                "template_vars": event.template_vars.clone(),
                "source_type": event.source_type.clone(),
                "source_id": event.source_id,
                "rule_id": rule.id,
            });

            let publish_result = self
                .publish_internal(
                    NOTIFICATION_TRIGGER_EVENT,
                    Some(template.id),
                    Some(event.event_code.clone()),
                    PublishNotificationCmd {
                        tenant_id: event.tenant_id,
                        trigger_type: None,
                        title,
                        body,
                        action_url,
                        recipient_selector: selector,
                        payload,
                        idempotency_key,
                        created_by: event.created_by.or(event.actor_user_id),
                    },
                )
                .await;

            match publish_result {
                Ok(_) => published += 1,
                Err(err) => {
                    tracing::warn!(
                        tenant_id = event.tenant_id,
                        event_code = event.event_code,
                        rule_id = rule.id,
                        error = %err,
                        "failed to publish notification event rule"
                    );
                }
            }
        }

        Ok(published)
    }

    async fn page_dispatches(
        &self,
        cmd: PageNotificationDispatchCmd,
    ) -> AppResult<(Vec<NotificationDispatch>, i64)> {
        self.repository
            .page_dispatches(&NotificationDispatchPageQuery {
                tenant_id: cmd.tenant_id,
                keyword: cmd.keyword,
                trigger_type: cmd.trigger_type,
                event_code: cmd.event_code,
                limit: cmd.limit,
                offset: cmd.offset,
            })
            .await
    }

    async fn page_user_notifications(
        &self,
        cmd: PageUserNotificationCmd,
    ) -> AppResult<(Vec<UserNotification>, i64)> {
        self.repository
            .page_user_notifications(&UserNotificationPageQuery {
                tenant_id: cmd.tenant_id,
                user_id: cmd.user_id,
                unread_only: cmd.unread_only,
                archived: cmd.archived,
                limit: cmd.limit,
                offset: cmd.offset,
            })
            .await
    }

    async fn unread_count(&self, tenant_id: i64, user_id: i64) -> AppResult<i64> {
        self.repository.unread_count(tenant_id, user_id).await
    }

    async fn mark_read(&self, tenant_id: i64, user_id: i64, ids: Vec<i64>) -> AppResult<()> {
        self.repository.mark_read(tenant_id, user_id, &ids).await?;
        self.emit_refresh_signal(tenant_id, user_id).await;
        Ok(())
    }

    async fn mark_all_read(&self, tenant_id: i64, user_id: i64) -> AppResult<()> {
        self.repository.mark_all_read(tenant_id, user_id).await?;
        self.emit_refresh_signal(tenant_id, user_id).await;
        Ok(())
    }

    async fn archive(&self, tenant_id: i64, user_id: i64, ids: Vec<i64>) -> AppResult<()> {
        self.repository.archive(tenant_id, user_id, &ids).await?;
        self.emit_refresh_signal(tenant_id, user_id).await;
        Ok(())
    }

    fn subscribe(&self) -> broadcast::Receiver<NotificationStreamSignal> {
        self.broadcaster.subscribe()
    }
}

fn normalize_payload(payload: Value) -> Value {
    match payload {
        Value::Object(_) => payload,
        Value::Null => json!({}),
        other => json!({ "value": other }),
    }
}

fn trim_optional_string(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim();
        (!trimmed.is_empty()).then(|| trimmed.to_string())
    })
}

fn render_template(template: &str, template_vars: &Value) -> String {
    let mut rendered = template.to_string();
    let mut replacements = Vec::new();
    collect_template_vars(None, template_vars, &mut replacements);

    for (key, value) in replacements {
        rendered = rendered.replace(format!("{{{{{key}}}}}").as_str(), value.as_str());
    }

    rendered
}

fn collect_template_vars(prefix: Option<String>, value: &Value, out: &mut Vec<(String, String)>) {
    match value {
        Value::Object(map) => {
            for (key, value) in map {
                let next_key = prefix
                    .as_ref()
                    .map(|prefix| format!("{prefix}.{key}"))
                    .unwrap_or_else(|| key.to_string());
                collect_template_vars(Some(next_key), value, out);
            }
        }
        _ => {
            if let Some(prefix) = prefix {
                out.push((prefix, scalar_to_string(value)));
            }
        }
    }
}

fn scalar_to_string(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::Bool(value) => value.to_string(),
        Value::Number(value) => value.to_string(),
        Value::String(value) => value.to_string(),
        Value::Array(value) => value
            .iter()
            .map(scalar_to_string)
            .collect::<Vec<_>>()
            .join(", "),
        Value::Object(value) => Value::Object(value.clone()).to_string(),
    }
}
