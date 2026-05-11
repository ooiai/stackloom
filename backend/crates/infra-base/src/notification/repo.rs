use std::{collections::BTreeSet, sync::Arc};

use chrono::{DateTime, Utc};
use common::core::biz_error::NOTIFICATION_TEMPLATE_CODE_EXISTS;
use domain_base::{
    NotificationDispatch, NotificationRecipientSelector, NotificationRepository, NotificationRule,
    NotificationRuleFire, NotificationTemplate, UserNotification,
    notification::{
        NOTIFICATION_TRIGGER_CRON_EXPRESSION, NOTIFICATION_TRIGGER_DELAY_ONCE,
        NOTIFICATION_TRIGGER_FIXED_SCHEDULE,
    },
    notification::{
        NotificationDispatchPageQuery, NotificationRulePageQuery, NotificationTemplatePageQuery,
        UserNotificationPageQuery,
    },
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Error as SqlxError, Postgres, QueryBuilder, types::Json};

use super::{
    NotificationDispatchRow, NotificationRuleFireRow, NotificationRuleRow, NotificationTemplateRow,
    UserNotificationRow,
};

#[derive(Debug, Clone)]
pub struct SqlxNotificationRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxNotificationRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505") {
                if db_err.constraint().as_deref()
                    == Some("uq_notification_templates_tenant_code_locale")
                {
                    return AppError::DataError(
                        NOTIFICATION_TEMPLATE_CODE_EXISTS,
                        "notification template code already exists".to_string(),
                    );
                }
            }
        }

        AppError::data_here(err.to_string())
    }
}

fn non_empty_str(value: &Option<String>) -> Option<&str> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

#[async_trait]
impl NotificationRepository for SqlxNotificationRepository {
    async fn create_template(
        &self,
        template: &NotificationTemplate,
    ) -> AppResult<NotificationTemplate> {
        let row = sqlx::query_as::<_, NotificationTemplateRow>(
            r#"
            INSERT INTO notification_templates (
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14
            )
            RETURNING
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            "#,
        )
        .bind(template.id)
        .bind(template.tenant_id)
        .bind(&template.code)
        .bind(&template.name)
        .bind(&template.event_code)
        .bind(&template.locale)
        .bind(&template.title_template)
        .bind(&template.body_template)
        .bind(&template.action_url_template)
        .bind(template.status)
        .bind(template.created_by)
        .bind(template.created_at)
        .bind(template.updated_at)
        .bind(template.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_template_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> AppResult<Option<NotificationTemplate>> {
        let row = sqlx::query_as::<_, NotificationTemplateRow>(
            r#"
            SELECT
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            FROM notification_templates
            WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn find_template_by_code(
        &self,
        tenant_id: i64,
        code: &str,
        locale: &str,
    ) -> AppResult<Option<NotificationTemplate>> {
        let row = sqlx::query_as::<_, NotificationTemplateRow>(
            r#"
            SELECT
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            FROM notification_templates
            WHERE tenant_id = $1
              AND code = $2
              AND locale = $3
              AND deleted_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(code)
        .bind(locale)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page_templates(
        &self,
        query: &NotificationTemplatePageQuery,
    ) -> AppResult<(Vec<NotificationTemplate>, i64)> {
        let mut count_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM notification_templates
            WHERE tenant_id = 
            "#,
        );
        count_builder.push_bind(query.tenant_id);
        count_builder.push(" AND deleted_at IS NULL");

        if let Some(status) = query.status {
            count_builder.push(" AND status = ");
            count_builder.push_bind(status);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            count_builder.push(" AND event_code = ");
            count_builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            count_builder.push(" AND (code ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR name ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR title_template ILIKE ");
            count_builder.push_bind(pattern);
            count_builder.push(")");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            FROM notification_templates
            WHERE tenant_id =
            "#,
        );
        builder.push_bind(query.tenant_id);
        builder.push(" AND deleted_at IS NULL");

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            builder.push(" AND event_code = ");
            builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            builder.push(" AND (code ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR title_template ILIKE ");
            builder.push_bind(pattern);
            builder.push(")");
        }

        builder.push(" ORDER BY created_at DESC");
        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }
        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<NotificationTemplateRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update_template(
        &self,
        template: &NotificationTemplate,
    ) -> AppResult<NotificationTemplate> {
        let row = sqlx::query_as::<_, NotificationTemplateRow>(
            r#"
            UPDATE notification_templates
            SET
                code = $3,
                name = $4,
                event_code = $5,
                locale = $6,
                title_template = $7,
                body_template = $8,
                action_url_template = $9,
                status = $10,
                updated_at = $11
            WHERE tenant_id = $1
              AND id = $2
              AND deleted_at IS NULL
            RETURNING
                id, tenant_id, code, name, event_code, locale, title_template, body_template,
                action_url_template, status, created_by, created_at, updated_at, deleted_at
            "#,
        )
        .bind(template.tenant_id)
        .bind(template.id)
        .bind(&template.code)
        .bind(&template.name)
        .bind(&template.event_code)
        .bind(&template.locale)
        .bind(&template.title_template)
        .bind(&template.body_template)
        .bind(&template.action_url_template)
        .bind(template.status)
        .bind(template.updated_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn create_rule(&self, rule: &NotificationRule) -> AppResult<NotificationRule> {
        let row = sqlx::query_as::<_, NotificationRuleRow>(
            r#"
            INSERT INTO notification_rules (
                id, tenant_id, name, event_code, template_id, trigger_mode, timezone,
                delay_seconds, schedule_kind, schedule_time, schedule_weekdays,
                cron_expression, next_run_at, last_run_at, last_fired_for, start_at, end_at,
                catchup_policy, last_error, consecutive_failure_count, recipient_selector_type,
                recipient_selector_payload, enabled, created_by, created_at, updated_at, deleted_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
            )
            RETURNING
                id, tenant_id, name, event_code, template_id, trigger_mode, timezone,
                delay_seconds, schedule_kind, schedule_time, schedule_weekdays, cron_expression,
                next_run_at, last_run_at, last_fired_for, start_at, end_at, catchup_policy,
                last_error, consecutive_failure_count, recipient_selector_type,
                recipient_selector_payload, enabled, created_by, created_at, updated_at,
                deleted_at, NULL::VARCHAR AS template_name, NULL::VARCHAR AS template_code
            "#,
        )
        .bind(rule.id)
        .bind(rule.tenant_id)
        .bind(&rule.name)
        .bind(&rule.event_code)
        .bind(rule.template_id)
        .bind(&rule.trigger_mode)
        .bind(&rule.timezone)
        .bind(rule.delay_seconds)
        .bind(&rule.schedule_kind)
        .bind(&rule.schedule_time)
        .bind(Json(rule.schedule_weekdays.clone()))
        .bind(&rule.cron_expression)
        .bind(rule.next_run_at)
        .bind(rule.last_run_at)
        .bind(rule.last_fired_for)
        .bind(rule.start_at)
        .bind(rule.end_at)
        .bind(&rule.catchup_policy)
        .bind(&rule.last_error)
        .bind(rule.consecutive_failure_count)
        .bind(&rule.recipient_selector_type)
        .bind(Json(rule.recipient_selector_payload.clone()))
        .bind(rule.enabled)
        .bind(rule.created_by)
        .bind(rule.created_at)
        .bind(rule.updated_at)
        .bind(rule.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_rule_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> AppResult<Option<NotificationRule>> {
        let row = sqlx::query_as::<_, NotificationRuleRow>(
            r#"
            SELECT
                nr.id, nr.tenant_id, nr.name, nr.event_code, nr.template_id, nr.trigger_mode,
                nr.timezone, nr.delay_seconds, nr.schedule_kind, nr.schedule_time,
                nr.schedule_weekdays, nr.cron_expression, nr.next_run_at, nr.last_run_at,
                nr.last_fired_for, nr.start_at, nr.end_at, nr.catchup_policy, nr.last_error,
                nr.consecutive_failure_count, nr.recipient_selector_type,
                nr.recipient_selector_payload, nr.enabled, nr.created_by, nr.created_at,
                nr.updated_at, nr.deleted_at,
                nt.name AS template_name,
                nt.code AS template_code
            FROM notification_rules nr
            LEFT JOIN notification_templates nt
              ON nt.id = nr.template_id
             AND nt.deleted_at IS NULL
            WHERE nr.tenant_id = $1
              AND nr.id = $2
              AND nr.deleted_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page_rules(
        &self,
        query: &NotificationRulePageQuery,
    ) -> AppResult<(Vec<NotificationRule>, i64)> {
        let mut count_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM notification_rules nr
            WHERE nr.tenant_id =
            "#,
        );
        count_builder.push_bind(query.tenant_id);
        count_builder.push(" AND nr.deleted_at IS NULL");

        if let Some(enabled) = query.enabled {
            count_builder.push(" AND nr.enabled = ");
            count_builder.push_bind(enabled);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            count_builder.push(" AND nr.event_code = ");
            count_builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            count_builder.push(" AND (nr.name ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR COALESCE(nr.event_code, '') ILIKE ");
            count_builder.push_bind(pattern);
            count_builder.push(")");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT
                nr.id, nr.tenant_id, nr.name, nr.event_code, nr.template_id, nr.trigger_mode,
                nr.timezone, nr.delay_seconds, nr.schedule_kind, nr.schedule_time,
                nr.schedule_weekdays, nr.cron_expression, nr.next_run_at, nr.last_run_at,
                nr.last_fired_for, nr.start_at, nr.end_at, nr.catchup_policy, nr.last_error,
                nr.consecutive_failure_count, nr.recipient_selector_type,
                nr.recipient_selector_payload, nr.enabled, nr.created_by, nr.created_at,
                nr.updated_at, nr.deleted_at,
                nt.name AS template_name,
                nt.code AS template_code
            FROM notification_rules nr
            LEFT JOIN notification_templates nt
              ON nt.id = nr.template_id
             AND nt.deleted_at IS NULL
            WHERE nr.tenant_id =
            "#,
        );
        builder.push_bind(query.tenant_id);
        builder.push(" AND nr.deleted_at IS NULL");

        if let Some(enabled) = query.enabled {
            builder.push(" AND nr.enabled = ");
            builder.push_bind(enabled);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            builder.push(" AND nr.event_code = ");
            builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            builder.push(" AND (nr.name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR COALESCE(nr.event_code, '') ILIKE ");
            builder.push_bind(pattern);
            builder.push(")");
        }

        builder.push(" ORDER BY nr.created_at DESC");
        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }
        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<NotificationRuleRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list_enabled_rules_by_event(
        &self,
        tenant_id: i64,
        event_code: &str,
    ) -> AppResult<Vec<NotificationRule>> {
        let rows = sqlx::query_as::<_, NotificationRuleRow>(
            r#"
            SELECT
                nr.id, nr.tenant_id, nr.name, nr.event_code, nr.template_id, nr.trigger_mode,
                nr.timezone, nr.delay_seconds, nr.schedule_kind, nr.schedule_time,
                nr.schedule_weekdays, nr.cron_expression, nr.next_run_at, nr.last_run_at,
                nr.last_fired_for, nr.start_at, nr.end_at, nr.catchup_policy, nr.last_error,
                nr.consecutive_failure_count, nr.recipient_selector_type,
                nr.recipient_selector_payload, nr.enabled, nr.created_by, nr.created_at,
                nr.updated_at, nr.deleted_at,
                nt.name AS template_name,
                nt.code AS template_code
            FROM notification_rules nr
            LEFT JOIN notification_templates nt
              ON nt.id = nr.template_id
             AND nt.deleted_at IS NULL
            WHERE nr.tenant_id = $1
              AND nr.event_code = $2
              AND nr.enabled = TRUE
              AND nr.deleted_at IS NULL
            ORDER BY nr.created_at ASC
            "#,
        )
        .bind(tenant_id)
        .bind(event_code)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn list_enabled_time_rules(&self) -> AppResult<Vec<NotificationRule>> {
        let rows = sqlx::query_as::<_, NotificationRuleRow>(
            r#"
            SELECT
                nr.id, nr.tenant_id, nr.name, nr.event_code, nr.template_id, nr.trigger_mode,
                nr.timezone, nr.delay_seconds, nr.schedule_kind, nr.schedule_time,
                nr.schedule_weekdays, nr.cron_expression, nr.next_run_at, nr.last_run_at,
                nr.last_fired_for, nr.start_at, nr.end_at, nr.catchup_policy, nr.last_error,
                nr.consecutive_failure_count, nr.recipient_selector_type,
                nr.recipient_selector_payload, nr.enabled, nr.created_by, nr.created_at,
                nr.updated_at, nr.deleted_at,
                nt.name AS template_name,
                nt.code AS template_code
            FROM notification_rules nr
            LEFT JOIN notification_templates nt
              ON nt.id = nr.template_id
             AND nt.deleted_at IS NULL
            WHERE nr.deleted_at IS NULL
              AND nr.enabled = TRUE
              AND nr.next_run_at IS NOT NULL
              AND nr.trigger_mode IN ($1, $2, $3)
            ORDER BY nr.next_run_at ASC, nr.created_at ASC
            "#,
        )
        .bind(NOTIFICATION_TRIGGER_DELAY_ONCE)
        .bind(NOTIFICATION_TRIGGER_FIXED_SCHEDULE)
        .bind(NOTIFICATION_TRIGGER_CRON_EXPRESSION)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn update_rule(&self, rule: &NotificationRule) -> AppResult<NotificationRule> {
        let row = sqlx::query_as::<_, NotificationRuleRow>(
            r#"
            UPDATE notification_rules
            SET
                name = $3,
                event_code = $4,
                template_id = $5,
                trigger_mode = $6,
                timezone = $7,
                delay_seconds = $8,
                schedule_kind = $9,
                schedule_time = $10,
                schedule_weekdays = $11,
                cron_expression = $12,
                next_run_at = $13,
                start_at = $14,
                end_at = $15,
                catchup_policy = $16,
                last_error = NULL,
                consecutive_failure_count = 0,
                recipient_selector_type = $17,
                recipient_selector_payload = $18,
                enabled = $19,
                updated_at = $20
            WHERE tenant_id = $1
              AND id = $2
              AND deleted_at IS NULL
            RETURNING
                id, tenant_id, name, event_code, template_id, trigger_mode, timezone,
                delay_seconds, schedule_kind, schedule_time, schedule_weekdays, cron_expression,
                next_run_at, last_run_at, last_fired_for, start_at, end_at, catchup_policy,
                last_error, consecutive_failure_count, recipient_selector_type,
                recipient_selector_payload, enabled, created_by, created_at, updated_at, deleted_at,
                NULL::VARCHAR AS template_name, NULL::VARCHAR AS template_code
            "#,
        )
        .bind(rule.tenant_id)
        .bind(rule.id)
        .bind(&rule.name)
        .bind(&rule.event_code)
        .bind(rule.template_id)
        .bind(&rule.trigger_mode)
        .bind(&rule.timezone)
        .bind(rule.delay_seconds)
        .bind(&rule.schedule_kind)
        .bind(&rule.schedule_time)
        .bind(Json(rule.schedule_weekdays.clone()))
        .bind(&rule.cron_expression)
        .bind(rule.next_run_at)
        .bind(rule.start_at)
        .bind(rule.end_at)
        .bind(&rule.catchup_policy)
        .bind(&rule.recipient_selector_type)
        .bind(Json(rule.recipient_selector_payload.clone()))
        .bind(rule.enabled)
        .bind(rule.updated_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn update_rule_schedule_state(
        &self,
        tenant_id: i64,
        id: i64,
        next_run_at: Option<DateTime<Utc>>,
        fired_at: Option<DateTime<Utc>>,
        fired_for: Option<DateTime<Utc>>,
        last_error: Option<String>,
        consecutive_failure_count: i32,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE notification_rules
            SET
                next_run_at = $3,
                last_run_at = $4,
                last_fired_for = $5,
                last_error = $6,
                consecutive_failure_count = $7,
                updated_at = now()
            WHERE tenant_id = $1
              AND id = $2
              AND deleted_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .bind(next_run_at)
        .bind(fired_at)
        .bind(fired_for)
        .bind(last_error)
        .bind(consecutive_failure_count)
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn upsert_rule_fire(
        &self,
        fire: &NotificationRuleFire,
    ) -> AppResult<NotificationRuleFire> {
        let row = sqlx::query_as::<_, NotificationRuleFireRow>(
            r#"
            INSERT INTO notification_rule_fires (
                id, tenant_id, rule_id, scheduled_at, fired_at, status, error_message, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (rule_id, scheduled_at)
            DO UPDATE SET
                fired_at = EXCLUDED.fired_at,
                status = EXCLUDED.status,
                error_message = EXCLUDED.error_message,
                updated_at = EXCLUDED.updated_at
            RETURNING
                id, tenant_id, rule_id, scheduled_at, fired_at, status, error_message, created_at, updated_at
            "#,
        )
        .bind(fire.id)
        .bind(fire.tenant_id)
        .bind(fire.rule_id)
        .bind(fire.scheduled_at)
        .bind(fire.fired_at)
        .bind(&fire.status)
        .bind(&fire.error_message)
        .bind(fire.created_at)
        .bind(fire.updated_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_dispatch_by_idempotency_key(
        &self,
        tenant_id: i64,
        idempotency_key: &str,
    ) -> AppResult<Option<NotificationDispatch>> {
        let row = sqlx::query_as::<_, NotificationDispatchRow>(
            r#"
            SELECT
                id, tenant_id, trigger_type, event_code, template_id, title, body, action_url,
                recipient_selector_type, recipient_selector_payload, payload, recipient_count,
                idempotency_key, created_by, created_at, updated_at
            FROM notification_dispatches
            WHERE tenant_id = $1
              AND idempotency_key = $2
            "#,
        )
        .bind(tenant_id)
        .bind(idempotency_key)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn create_dispatch(
        &self,
        dispatch: &NotificationDispatch,
        recipient_user_ids: &[i64],
    ) -> AppResult<(NotificationDispatch, Vec<UserNotification>)> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        let dispatch_row = sqlx::query_as::<_, NotificationDispatchRow>(
            r#"
            INSERT INTO notification_dispatches (
                id, tenant_id, trigger_type, event_code, template_id, title, body, action_url,
                recipient_selector_type, recipient_selector_payload, payload, recipient_count,
                idempotency_key, created_by, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING
                id, tenant_id, trigger_type, event_code, template_id, title, body, action_url,
                recipient_selector_type, recipient_selector_payload, payload, recipient_count,
                idempotency_key, created_by, created_at, updated_at
            "#,
        )
        .bind(dispatch.id)
        .bind(dispatch.tenant_id)
        .bind(&dispatch.trigger_type)
        .bind(&dispatch.event_code)
        .bind(dispatch.template_id)
        .bind(&dispatch.title)
        .bind(&dispatch.body)
        .bind(&dispatch.action_url)
        .bind(&dispatch.recipient_selector_type)
        .bind(Json(dispatch.recipient_selector_payload.clone()))
        .bind(Json(dispatch.payload.clone()))
        .bind(dispatch.recipient_count)
        .bind(&dispatch.idempotency_key)
        .bind(dispatch.created_by)
        .bind(dispatch.created_at)
        .bind(dispatch.updated_at)
        .fetch_one(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        let created_at = dispatch.created_at;
        let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            INSERT INTO user_notifications (
                id, tenant_id, dispatch_id, user_id, title, body, action_url, read_at, archived_at, created_at
            )
            "#,
        );
        builder.push_values(recipient_user_ids.iter(), |mut row, user_id| {
            row.push_bind(neocrates::helper::core::snowflake::generate_sonyflake_id() as i64)
                .push_bind(dispatch.tenant_id)
                .push_bind(dispatch.id)
                .push_bind(*user_id)
                .push_bind(&dispatch.title)
                .push_bind(&dispatch.body)
                .push_bind(&dispatch.action_url)
                .push_bind(None::<chrono::DateTime<Utc>>)
                .push_bind(None::<chrono::DateTime<Utc>>)
                .push_bind(created_at);
        });
        builder.push(
            r#"
            RETURNING
                id, tenant_id, dispatch_id, user_id, title, body, action_url, read_at, archived_at, created_at
            "#,
        );

        let notification_rows: Vec<UserNotificationRow> = builder
            .build_query_as()
            .fetch_all(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok((
            dispatch_row.into(),
            notification_rows.into_iter().map(Into::into).collect(),
        ))
    }

    async fn page_dispatches(
        &self,
        query: &NotificationDispatchPageQuery,
    ) -> AppResult<(Vec<NotificationDispatch>, i64)> {
        let mut count_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM notification_dispatches
            WHERE tenant_id =
            "#,
        );
        count_builder.push_bind(query.tenant_id);

        if let Some(trigger_type) = non_empty_str(&query.trigger_type) {
            count_builder.push(" AND trigger_type = ");
            count_builder.push_bind(trigger_type);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            count_builder.push(" AND event_code = ");
            count_builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            count_builder.push(" AND (title ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR body ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR COALESCE(event_code, '') ILIKE ");
            count_builder.push_bind(pattern);
            count_builder.push(")");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT
                id, tenant_id, trigger_type, event_code, template_id, title, body, action_url,
                recipient_selector_type, recipient_selector_payload, payload, recipient_count,
                idempotency_key, created_by, created_at, updated_at
            FROM notification_dispatches
            WHERE tenant_id =
            "#,
        );
        builder.push_bind(query.tenant_id);

        if let Some(trigger_type) = non_empty_str(&query.trigger_type) {
            builder.push(" AND trigger_type = ");
            builder.push_bind(trigger_type);
        }
        if let Some(event_code) = non_empty_str(&query.event_code) {
            builder.push(" AND event_code = ");
            builder.push_bind(event_code);
        }
        if let Some(keyword) = non_empty_str(&query.keyword) {
            let pattern = format!("%{}%", keyword);
            builder.push(" AND (title ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR body ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR COALESCE(event_code, '') ILIKE ");
            builder.push_bind(pattern);
            builder.push(")");
        }

        builder.push(" ORDER BY created_at DESC");
        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }
        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<NotificationDispatchRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn page_user_notifications(
        &self,
        query: &UserNotificationPageQuery,
    ) -> AppResult<(Vec<UserNotification>, i64)> {
        let mut count_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM user_notifications
            WHERE tenant_id =
            "#,
        );
        count_builder.push_bind(query.tenant_id);
        count_builder.push(" AND user_id = ");
        count_builder.push_bind(query.user_id);

        if query.archived.unwrap_or(false) {
            count_builder.push(" AND archived_at IS NOT NULL");
        } else {
            count_builder.push(" AND archived_at IS NULL");
        }
        if query.unread_only.unwrap_or(false) {
            count_builder.push(" AND read_at IS NULL");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
            SELECT
                id, tenant_id, dispatch_id, user_id, title, body, action_url, read_at, archived_at, created_at
            FROM user_notifications
            WHERE tenant_id =
            "#,
        );
        builder.push_bind(query.tenant_id);
        builder.push(" AND user_id = ");
        builder.push_bind(query.user_id);

        if query.archived.unwrap_or(false) {
            builder.push(" AND archived_at IS NOT NULL");
        } else {
            builder.push(" AND archived_at IS NULL");
        }
        if query.unread_only.unwrap_or(false) {
            builder.push(" AND read_at IS NULL");
        }

        builder.push(" ORDER BY created_at DESC");
        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }
        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<UserNotificationRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn unread_count(&self, tenant_id: i64, user_id: i64) -> AppResult<i64> {
        sqlx::query_scalar(
            r#"
            SELECT COUNT(*) AS total
            FROM user_notifications
            WHERE tenant_id = $1
              AND user_id = $2
              AND read_at IS NULL
              AND archived_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(user_id)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)
    }

    async fn mark_read(&self, tenant_id: i64, user_id: i64, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        sqlx::query(
            r#"
            UPDATE user_notifications
            SET read_at = COALESCE(read_at, $4)
            WHERE tenant_id = $1
              AND user_id = $2
              AND id = ANY($3)
            "#,
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(ids.to_vec())
        .bind(chrono::Utc::now())
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn mark_all_read(&self, tenant_id: i64, user_id: i64) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE user_notifications
            SET read_at = COALESCE(read_at, $3)
            WHERE tenant_id = $1
              AND user_id = $2
              AND archived_at IS NULL
            "#,
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(chrono::Utc::now())
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn archive(&self, tenant_id: i64, user_id: i64, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        sqlx::query(
            r#"
            UPDATE user_notifications
            SET archived_at = COALESCE(archived_at, $4)
            WHERE tenant_id = $1
              AND user_id = $2
              AND id = ANY($3)
            "#,
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(ids.to_vec())
        .bind(chrono::Utc::now())
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn resolve_recipient_user_ids(
        &self,
        tenant_id: i64,
        selector: &NotificationRecipientSelector,
        actor_user_id: Option<i64>,
    ) -> AppResult<Vec<i64>> {
        let mut user_ids = match selector {
            NotificationRecipientSelector::TenantAll => sqlx::query_scalar(
                r#"
                    SELECT DISTINCT user_id
                    FROM user_tenants
                    WHERE tenant_id = $1
                      AND status = 1
                      AND deleted_at IS NULL
                    "#,
            )
            .bind(tenant_id)
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?,
            NotificationRecipientSelector::TenantAdmins => sqlx::query_scalar(
                r#"
                    SELECT DISTINCT user_id
                    FROM user_tenants
                    WHERE tenant_id = $1
                      AND status = 1
                      AND is_tenant_admin = TRUE
                      AND deleted_at IS NULL
                    "#,
            )
            .bind(tenant_id)
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?,
            NotificationRecipientSelector::ExplicitUsers(requested_user_ids) => sqlx::query_scalar(
                r#"
                    SELECT DISTINCT user_id
                    FROM user_tenants
                    WHERE tenant_id = $1
                      AND status = 1
                      AND deleted_at IS NULL
                      AND user_id = ANY($2)
                    "#,
            )
            .bind(tenant_id)
            .bind(requested_user_ids)
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?,
            NotificationRecipientSelector::Actor => {
                if let Some(actor_user_id) = actor_user_id {
                    sqlx::query_scalar(
                        r#"
                        SELECT DISTINCT user_id
                        FROM user_tenants
                        WHERE tenant_id = $1
                          AND status = 1
                          AND deleted_at IS NULL
                          AND user_id = $2
                        "#,
                    )
                    .bind(tenant_id)
                    .bind(actor_user_id)
                    .fetch_all(self.pool.pool())
                    .await
                    .map_err(Self::map_sqlx_error)?
                } else {
                    Vec::new()
                }
            }
        };

        let mut unique = BTreeSet::new();
        user_ids.retain(|user_id| unique.insert(*user_id));
        Ok(user_ids)
    }
}
