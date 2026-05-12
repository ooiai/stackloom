-- OAuth2 client application registry (tenant-scoped developer apps).
-- Each tenant can register multiple OAuth2 applications with their own
-- client_id/client_secret, allowed redirect URIs, and allowed scopes.

CREATE TABLE IF NOT EXISTS oauth_clients (
    id                  BIGINT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    name                VARCHAR(200) NOT NULL,
    client_id           VARCHAR(64) NOT NULL,
    client_secret_hash  VARCHAR(500) NOT NULL,
    redirect_uris       TEXT[] NOT NULL DEFAULT '{}',
    allowed_scopes      TEXT[] NOT NULL DEFAULT '{}',
    status              SMALLINT NOT NULL DEFAULT 1,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT uq_oauth_clients_client_id UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_tenant_id ON oauth_clients (tenant_id);
