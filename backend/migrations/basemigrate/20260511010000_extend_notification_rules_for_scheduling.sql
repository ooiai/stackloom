ALTER TABLE notification_rules
    ALTER COLUMN event_code DROP NOT NULL;

ALTER TABLE notification_rules
    ADD COLUMN trigger_mode VARCHAR(32) NOT NULL DEFAULT 'event',
    ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
    ADD COLUMN delay_seconds BIGINT,
    ADD COLUMN schedule_kind VARCHAR(32),
    ADD COLUMN schedule_time VARCHAR(5),
    ADD COLUMN schedule_weekdays JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN cron_expression VARCHAR(120),
    ADD COLUMN next_run_at TIMESTAMPTZ,
    ADD COLUMN last_run_at TIMESTAMPTZ,
    ADD COLUMN last_fired_for TIMESTAMPTZ,
    ADD COLUMN start_at TIMESTAMPTZ,
    ADD COLUMN end_at TIMESTAMPTZ,
    ADD COLUMN catchup_policy VARCHAR(32) NOT NULL DEFAULT 'fire_once',
    ADD COLUMN last_error TEXT,
    ADD COLUMN consecutive_failure_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_notification_rules_next_run
    ON notification_rules (tenant_id, next_run_at)
    WHERE deleted_at IS NULL AND enabled = TRUE AND next_run_at IS NOT NULL;

CREATE TABLE notification_rule_fires (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id BIGINT NOT NULL REFERENCES notification_rules(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    fired_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_notification_rule_fires_rule_schedule UNIQUE (rule_id, scheduled_at)
);

CREATE INDEX idx_notification_rule_fires_rule_created
    ON notification_rule_fires (rule_id, created_at DESC);
