-- OAuth2 token pairs issued to developer applications after authorization.
-- access_token: short-lived (15 min). refresh_token: long-lived (30 days), revocable.

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id                       BIGINT PRIMARY KEY,
    oauth_client_id          BIGINT NOT NULL,
    user_id                  BIGINT NOT NULL,
    tenant_id                BIGINT NOT NULL,
    access_token             VARCHAR(128) NOT NULL,
    refresh_token            VARCHAR(128) NOT NULL,
    scopes                   TEXT[] NOT NULL DEFAULT '{}',
    access_token_expires_at  TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    revoked_at               TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oauth_tokens_access_token  UNIQUE (access_token),
    CONSTRAINT uq_oauth_tokens_refresh_token UNIQUE (refresh_token)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_oauth_client_id ON oauth_tokens (oauth_client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id         ON oauth_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token    ON oauth_tokens (access_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh_token   ON oauth_tokens (refresh_token);
