-- Third-party OAuth provider bindings (user account ↔ external provider identity).
-- One user may have multiple provider bindings (e.g., Google + GitHub).

CREATE TABLE IF NOT EXISTS oauth_providers (
    id                 BIGINT PRIMARY KEY,
    user_id            BIGINT NOT NULL,
    provider           VARCHAR(50) NOT NULL,
    provider_user_id   VARCHAR(200) NOT NULL,
    provider_username  VARCHAR(200),
    provider_email     VARCHAR(200),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oauth_providers_provider_uid UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers (user_id);
