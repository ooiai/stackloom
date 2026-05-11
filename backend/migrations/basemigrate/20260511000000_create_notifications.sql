CREATE TABLE notification_templates (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(120) NOT NULL,
    event_code VARCHAR(120),
    locale VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
    title_template VARCHAR(200) NOT NULL,
    body_template TEXT NOT NULL,
    action_url_template VARCHAR(500),
    status SMALLINT NOT NULL DEFAULT 1,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_notification_templates_tenant_code_locale
        UNIQUE (tenant_id, code, locale)
);

CREATE INDEX idx_notification_templates_tenant_created
    ON notification_templates (tenant_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE notification_rules (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    event_code VARCHAR(120) NOT NULL,
    template_id BIGINT NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
    recipient_selector_type VARCHAR(32) NOT NULL,
    recipient_selector_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_rules_event
    ON notification_rules (tenant_id, event_code, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE notification_dispatches (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trigger_type VARCHAR(32) NOT NULL,
    event_code VARCHAR(120),
    template_id BIGINT REFERENCES notification_templates(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    action_url VARCHAR(500),
    recipient_selector_type VARCHAR(32) NOT NULL,
    recipient_selector_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    recipient_count BIGINT NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(160),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_notification_dispatches_tenant_idempotency
    ON notification_dispatches (tenant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_notification_dispatches_tenant_created
    ON notification_dispatches (tenant_id, created_at DESC);

CREATE TABLE user_notifications (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dispatch_id BIGINT NOT NULL REFERENCES notification_dispatches(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    action_url VARCHAR(500),
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_notifications_dispatch_user UNIQUE (dispatch_id, user_id)
);

CREATE INDEX idx_user_notifications_inbox
    ON user_notifications (tenant_id, user_id, created_at DESC);

CREATE INDEX idx_user_notifications_unread
    ON user_notifications (tenant_id, user_id, created_at DESC)
    WHERE read_at IS NULL AND archived_at IS NULL;
