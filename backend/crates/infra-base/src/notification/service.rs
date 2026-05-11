use std::{str::FromStr, sync::Arc};

use apalis::prelude::Storage;
use apalis_redis::RedisStorage;
use chrono::{DateTime, Datelike, Duration, LocalResult, NaiveDateTime, NaiveTime, TimeZone, Utc};
use chrono_tz::Tz;
use common::core::biz_error::{
    NOTIFICATION_EVENT_ACTOR_REQUIRED, NOTIFICATION_RECIPIENT_EMPTY,
    NOTIFICATION_TEMPLATE_CODE_EXISTS,
};
use croner::Cron;
use domain_base::{
    CreateNotificationRuleCmd, CreateNotificationTemplateCmd, NotificationDispatch,
    NotificationEvent, NotificationRecipientSelector, NotificationRepository, NotificationRule,
    NotificationRuleFire, NotificationService, NotificationStreamSignal, NotificationTemplate,
    PageNotificationDispatchCmd, PageNotificationRuleCmd, PageNotificationTemplateCmd,
    PageUserNotificationCmd, PublishNotificationCmd, UpdateNotificationRuleCmd,
    UpdateNotificationTemplateCmd, UserNotification,
    notification::{
        NOTIFICATION_SCHEDULE_DAILY, NOTIFICATION_SCHEDULE_WEEKLY,
        NOTIFICATION_STREAM_REASON_CREATED, NOTIFICATION_STREAM_REASON_REFRESH,
        NOTIFICATION_TRIGGER_CRON_EXPRESSION, NOTIFICATION_TRIGGER_DELAY_ONCE,
        NOTIFICATION_TRIGGER_DIRECT, NOTIFICATION_TRIGGER_EVENT,
        NOTIFICATION_TRIGGER_FIXED_SCHEDULE, NotificationDispatchPageQuery,
        NotificationRulePageQuery, NotificationTemplatePageQuery, UserNotificationPageQuery,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    serde::{Deserialize, Serialize},
    serde_json::{Value, json},
    sqlxhelper::pool::SqlxPool,
    tokio::sync::broadcast,
    tracing,
};

use super::repo::SqlxNotificationRepository;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationRuleFireJob {
    pub tenant_id: i64,
    pub rule_id: i64,
    pub scheduled_at: DateTime<Utc>,
}

#[derive(Clone)]
pub struct NotificationRuleJobScheduler {
    storage: RedisStorage<NotificationRuleFireJob>,
}

impl NotificationRuleJobScheduler {
    pub fn new(storage: RedisStorage<NotificationRuleFireJob>) -> Self {
        Self { storage }
    }

    pub async fn schedule(
        &self,
        job: NotificationRuleFireJob,
        run_at: DateTime<Utc>,
    ) -> AppResult<()> {
        let mut storage = self.storage.clone();
        storage
            .schedule(job, run_at.timestamp())
            .await
            .map(|_| ())
            .map_err(|err| AppError::data_here(err.to_string()))
    }
}

#[derive(Clone)]
pub struct NotificationServiceImpl<R>
where
    R: NotificationRepository,
{
    repository: Arc<R>,
    broadcaster: broadcast::Sender<NotificationStreamSignal>,
    scheduler: Option<Arc<NotificationRuleJobScheduler>>,
}

impl NotificationServiceImpl<SqlxNotificationRepository> {
    pub fn new(pool: Arc<SqlxPool>, scheduler: Option<Arc<NotificationRuleJobScheduler>>) -> Self {
        let (broadcaster, _) = broadcast::channel(256);
        Self {
            repository: Arc::new(SqlxNotificationRepository::new(pool)),
            broadcaster,
            scheduler,
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
            scheduler: None,
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

    async fn schedule_rule_if_needed(&self, rule: &NotificationRule) -> AppResult<()> {
        if !rule.enabled || !is_time_rule(rule.trigger_mode.as_str()) {
            return Ok(());
        }

        let Some(run_at) = rule.next_run_at else {
            return Ok(());
        };

        let Some(scheduler) = self.scheduler.as_ref() else {
            return Ok(());
        };

        scheduler
            .schedule(
                NotificationRuleFireJob {
                    tenant_id: rule.tenant_id,
                    rule_id: rule.id,
                    scheduled_at: run_at,
                },
                run_at,
            )
            .await
    }

    fn prepare_rule_for_save(
        &self,
        rule: &mut NotificationRule,
        reference: DateTime<Utc>,
    ) -> AppResult<()> {
        if !rule.enabled || rule.trigger_mode == NOTIFICATION_TRIGGER_EVENT {
            rule.next_run_at = None;
            return Ok(());
        }

        rule.last_run_at = None;
        rule.last_fired_for = None;
        rule.next_run_at = calculate_initial_next_run_at(rule, reference)?;
        Ok(())
    }

    pub async fn sync_time_rule_jobs(&self) -> AppResult<()> {
        let rules = self.repository.list_enabled_time_rules().await?;
        for rule in rules {
            self.schedule_rule_if_needed(&rule).await?;
        }
        Ok(())
    }

    pub async fn fire_rule_job(&self, job: NotificationRuleFireJob) -> AppResult<()> {
        let Some(rule) = self
            .repository
            .find_rule_by_id(job.tenant_id, job.rule_id)
            .await?
        else {
            return Ok(());
        };

        if !rule.enabled
            || !is_time_rule(rule.trigger_mode.as_str())
            || rule.next_run_at != Some(job.scheduled_at)
        {
            return Ok(());
        }

        let fire_id = generate_sonyflake_id() as i64;
        let mut fire_record = NotificationRuleFire {
            id: fire_id,
            tenant_id: rule.tenant_id,
            rule_id: rule.id,
            scheduled_at: job.scheduled_at,
            fired_at: None,
            status: "processing".to_string(),
            error_message: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let _ = self.repository.upsert_rule_fire(&fire_record).await?;

        let Some(template) = self.load_template_or_skip(rule.tenant_id, &rule).await? else {
            self.repository
                .update_rule_schedule_state(
                    rule.tenant_id,
                    rule.id,
                    rule.next_run_at,
                    None,
                    None,
                    Some("notification template unavailable".to_string()),
                    rule.consecutive_failure_count + 1,
                )
                .await?;
            fire_record.status = "failed".to_string();
            fire_record.error_message = Some("notification template unavailable".to_string());
            fire_record.updated_at = Utc::now();
            let _ = self.repository.upsert_rule_fire(&fire_record).await?;
            self.retry_rule_job(job).await?;
            return Ok(());
        };

        let selector = match rule.recipient_selector() {
            Ok(selector) => selector,
            Err(err) => {
                self.repository
                    .update_rule_schedule_state(
                        rule.tenant_id,
                        rule.id,
                        rule.next_run_at,
                        None,
                        None,
                        Some(err.to_string()),
                        rule.consecutive_failure_count + 1,
                    )
                    .await?;
                fire_record.status = "failed".to_string();
                fire_record.error_message = Some(err.to_string());
                fire_record.updated_at = Utc::now();
                let _ = self.repository.upsert_rule_fire(&fire_record).await?;
                self.retry_rule_job(job).await?;
                return Ok(());
            }
        };

        if matches!(selector, NotificationRecipientSelector::Actor) {
            self.repository
                .update_rule_schedule_state(
                    rule.tenant_id,
                    rule.id,
                    rule.next_run_at,
                    None,
                    None,
                    Some(NOTIFICATION_EVENT_ACTOR_REQUIRED.to_string()),
                    rule.consecutive_failure_count + 1,
                )
                .await?;
            fire_record.status = "failed".to_string();
            fire_record.error_message = Some(
                "actor selector is not supported for time-driven notification rules".to_string(),
            );
            fire_record.updated_at = Utc::now();
            let _ = self.repository.upsert_rule_fire(&fire_record).await?;
            return Ok(());
        }

        let rendered_vars = json!({});
        let title = render_template(&template.title_template, &rendered_vars);
        let body = render_template(&template.body_template, &rendered_vars);
        let action_url = template
            .action_url_template
            .as_ref()
            .map(|value| render_template(value, &rendered_vars));
        let idempotency_key = Some(format!(
            "rule:{}:fire:{}",
            rule.id,
            job.scheduled_at.to_rfc3339()
        ));
        let payload = json!({
            "rule_id": rule.id,
            "scheduled_at": job.scheduled_at,
            "trigger_mode": rule.trigger_mode,
        });

        match self
            .publish_internal(
                rule.trigger_mode.as_str(),
                Some(template.id),
                rule.event_code.clone(),
                PublishNotificationCmd {
                    tenant_id: rule.tenant_id,
                    trigger_type: None,
                    template_id: Some(template.id),
                    title,
                    body,
                    action_url,
                    recipient_selector: selector,
                    payload,
                    idempotency_key,
                    created_by: rule.created_by,
                },
            )
            .await
        {
            Ok(_) => {
                let fired_at = Utc::now();
                let next_run_at = calculate_next_run_after_fire(&rule, job.scheduled_at)?;
                self.repository
                    .update_rule_schedule_state(
                        rule.tenant_id,
                        rule.id,
                        next_run_at,
                        Some(fired_at),
                        Some(job.scheduled_at),
                        None,
                        0,
                    )
                    .await?;
                fire_record.fired_at = Some(fired_at);
                fire_record.status = "succeeded".to_string();
                fire_record.error_message = None;
                fire_record.updated_at = fired_at;
                let _ = self.repository.upsert_rule_fire(&fire_record).await?;
                if let Some(next_run_at) = next_run_at {
                    if let Some(scheduler) = self.scheduler.as_ref() {
                        scheduler
                            .schedule(
                                NotificationRuleFireJob {
                                    tenant_id: rule.tenant_id,
                                    rule_id: rule.id,
                                    scheduled_at: next_run_at,
                                },
                                next_run_at,
                            )
                            .await?;
                    }
                }
            }
            Err(err) => {
                let error_message = err.to_string();
                self.repository
                    .update_rule_schedule_state(
                        rule.tenant_id,
                        rule.id,
                        rule.next_run_at,
                        None,
                        None,
                        Some(error_message.clone()),
                        rule.consecutive_failure_count + 1,
                    )
                    .await?;
                fire_record.status = "failed".to_string();
                fire_record.error_message = Some(error_message);
                fire_record.updated_at = Utc::now();
                let _ = self.repository.upsert_rule_fire(&fire_record).await?;
                self.retry_rule_job(job).await?;
            }
        }

        Ok(())
    }

    async fn retry_rule_job(&self, job: NotificationRuleFireJob) -> AppResult<()> {
        let Some(scheduler) = self.scheduler.as_ref() else {
            return Ok(());
        };

        scheduler
            .schedule(job, Utc::now() + Duration::minutes(1))
            .await
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
        let mut rule =
            NotificationRule::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;
        self.prepare_rule_for_save(&mut rule, Utc::now())?;
        let rule = self.repository.create_rule(&rule).await?;
        self.schedule_rule_if_needed(&rule).await?;
        Ok(rule)
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
        self.prepare_rule_for_save(&mut rule, Utc::now())?;
        let rule = self.repository.update_rule(&rule).await?;
        self.schedule_rule_if_needed(&rule).await?;
        Ok(rule)
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
        if let Some(template_id) = cmd.template_id {
            self.repository
                .find_template_by_id(cmd.tenant_id, template_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!(
                        "notification template not found: {template_id}"
                    ))
                })?;
        }

        let trigger_type = cmd
            .trigger_type
            .clone()
            .unwrap_or_else(|| NOTIFICATION_TRIGGER_DIRECT.to_string());
        self.publish_internal(trigger_type.as_str(), cmd.template_id, None, cmd)
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
                        template_id: Some(template.id),
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

fn is_time_rule(trigger_mode: &str) -> bool {
    matches!(
        trigger_mode,
        NOTIFICATION_TRIGGER_DELAY_ONCE
            | NOTIFICATION_TRIGGER_FIXED_SCHEDULE
            | NOTIFICATION_TRIGGER_CRON_EXPRESSION
    )
}

fn calculate_initial_next_run_at(
    rule: &NotificationRule,
    reference: DateTime<Utc>,
) -> AppResult<Option<DateTime<Utc>>> {
    match rule.trigger_mode.as_str() {
        NOTIFICATION_TRIGGER_EVENT => Ok(None),
        NOTIFICATION_TRIGGER_DELAY_ONCE => {
            let delay_seconds = rule.delay_seconds.ok_or_else(|| {
                AppError::ValidationError("delay_seconds is required".to_string())
            })?;
            let base = rule.start_at.unwrap_or(reference);
            let next_run_at = base + Duration::seconds(delay_seconds);
            if exceeds_end_at(rule, next_run_at) {
                return Ok(None);
            }
            Ok(Some(next_run_at))
        }
        NOTIFICATION_TRIGGER_FIXED_SCHEDULE => calculate_fixed_schedule_next_run(rule, reference),
        NOTIFICATION_TRIGGER_CRON_EXPRESSION => calculate_cron_next_run(rule, reference),
        _ => Err(AppError::ValidationError(format!(
            "unsupported notification trigger mode: {}",
            rule.trigger_mode
        ))),
    }
}

fn calculate_next_run_after_fire(
    rule: &NotificationRule,
    scheduled_at: DateTime<Utc>,
) -> AppResult<Option<DateTime<Utc>>> {
    match rule.trigger_mode.as_str() {
        NOTIFICATION_TRIGGER_DELAY_ONCE => Ok(None),
        NOTIFICATION_TRIGGER_FIXED_SCHEDULE => {
            calculate_fixed_schedule_next_run(rule, scheduled_at + Duration::seconds(1))
        }
        NOTIFICATION_TRIGGER_CRON_EXPRESSION => {
            calculate_cron_next_run(rule, scheduled_at + Duration::seconds(1))
        }
        NOTIFICATION_TRIGGER_EVENT => Ok(None),
        _ => Err(AppError::ValidationError(format!(
            "unsupported notification trigger mode: {}",
            rule.trigger_mode
        ))),
    }
}

fn calculate_fixed_schedule_next_run(
    rule: &NotificationRule,
    reference: DateTime<Utc>,
) -> AppResult<Option<DateTime<Utc>>> {
    let timezone = parse_rule_timezone(rule)?;
    let schedule_time = parse_schedule_time(rule)?;
    let reference = rule
        .start_at
        .map_or(reference, |start_at| reference.max(start_at));
    let reference_local = reference.with_timezone(&timezone);

    for day_offset in 0..=370 {
        let candidate_date = reference_local.date_naive() + Duration::days(day_offset);
        if !matches_schedule_date(rule, candidate_date.weekday())? {
            continue;
        }

        let local_datetime =
            resolve_local_datetime(timezone, NaiveDateTime::new(candidate_date, schedule_time))?;
        if local_datetime <= reference_local {
            continue;
        }

        let candidate_utc = local_datetime.with_timezone(&Utc);
        if exceeds_end_at(rule, candidate_utc) {
            return Ok(None);
        }
        return Ok(Some(candidate_utc));
    }

    Ok(None)
}

fn calculate_cron_next_run(
    rule: &NotificationRule,
    reference: DateTime<Utc>,
) -> AppResult<Option<DateTime<Utc>>> {
    let timezone = parse_rule_timezone(rule)?;
    let cron_expression = rule
        .cron_expression
        .as_ref()
        .ok_or_else(|| AppError::ValidationError("cron_expression is required".to_string()))?;
    let reference = rule
        .start_at
        .map_or(reference, |start_at| reference.max(start_at));
    let reference_local = reference.with_timezone(&timezone);
    let cron = Cron::from_str(cron_expression)
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let next_local = cron
        .find_next_occurrence(&reference_local, false)
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
    let next_utc = next_local.with_timezone(&Utc);

    if exceeds_end_at(rule, next_utc) {
        return Ok(None);
    }

    Ok(Some(next_utc))
}

fn parse_rule_timezone(rule: &NotificationRule) -> AppResult<Tz> {
    Tz::from_str(rule.timezone.trim()).map_err(|err| AppError::ValidationError(err.to_string()))
}

fn parse_schedule_time(rule: &NotificationRule) -> AppResult<NaiveTime> {
    let schedule_time = rule
        .schedule_time
        .as_deref()
        .ok_or_else(|| AppError::ValidationError("schedule_time is required".to_string()))?;
    NaiveTime::parse_from_str(schedule_time, "%H:%M")
        .map_err(|err| AppError::ValidationError(err.to_string()))
}

fn matches_schedule_date(rule: &NotificationRule, weekday: chrono::Weekday) -> AppResult<bool> {
    match rule.schedule_kind.as_deref() {
        Some(NOTIFICATION_SCHEDULE_DAILY) => Ok(true),
        Some(NOTIFICATION_SCHEDULE_WEEKLY) => {
            let weekdays = &rule.schedule_weekdays;
            if weekdays.is_empty() {
                return Err(AppError::ValidationError(
                    "schedule_weekdays is required".to_string(),
                ));
            }
            let weekday_value = weekday.number_from_monday() as i16;
            Ok(weekdays.iter().any(|value| *value == weekday_value))
        }
        Some(other) => Err(AppError::ValidationError(format!(
            "unsupported notification schedule kind: {other}"
        ))),
        None => Err(AppError::ValidationError(
            "schedule_kind is required".to_string(),
        )),
    }
}

fn resolve_local_datetime(timezone: Tz, naive: NaiveDateTime) -> AppResult<DateTime<Tz>> {
    match timezone.from_local_datetime(&naive) {
        LocalResult::Single(value) => Ok(value),
        LocalResult::Ambiguous(first, _) => Ok(first),
        LocalResult::None => Err(AppError::ValidationError(format!(
            "invalid local datetime: {naive}"
        ))),
    }
}

fn exceeds_end_at(rule: &NotificationRule, candidate: DateTime<Utc>) -> bool {
    rule.end_at.is_some_and(|end_at| candidate > end_at)
}
