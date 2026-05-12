CREATE TABLE IF NOT EXISTS user_login_events (
    id          BIGINT      PRIMARY KEY,
    user_id     BIGINT      NOT NULL,
    tenant_id   BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_login_events_user_id
    ON user_login_events (user_id);

CREATE INDEX IF NOT EXISTS idx_user_login_events_created_at
    ON user_login_events (created_at);

CREATE INDEX IF NOT EXISTS idx_user_login_events_user_date
    ON user_login_events (user_id, created_at);
