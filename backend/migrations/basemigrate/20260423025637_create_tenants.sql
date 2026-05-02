-- Create tenants table only

CREATE TABLE tenants (
    id BIGINT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_user_id BIGINT,
    parent_id BIGINT,
    status SMALLINT NOT NULL DEFAULT 1,
    plan_code VARCHAR(100),
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_tenants_slug UNIQUE (slug),
    CONSTRAINT chk_tenants_status CHECK (status IN (0, 1, 2))
);

COMMENT ON TABLE tenants IS '租户表';

COMMENT ON COLUMN tenants.id IS '租户ID，主键';
COMMENT ON COLUMN tenants.slug IS '租户唯一标识，如公司编码或子域名前缀';
COMMENT ON COLUMN tenants.name IS '租户名称';
COMMENT ON COLUMN tenants.description IS '租户描述';
COMMENT ON COLUMN tenants.owner_user_id IS '租户拥有者用户ID';
COMMENT ON COLUMN tenants.parent_id IS '父租户ID';
COMMENT ON COLUMN tenants.status IS '租户状态：0禁用，1正常，2过期/冻结';
COMMENT ON COLUMN tenants.plan_code IS '租户套餐编码';
COMMENT ON COLUMN tenants.expired_at IS '租户到期时间';
COMMENT ON COLUMN tenants.created_at IS '创建时间';
COMMENT ON COLUMN tenants.updated_at IS '更新时间';
COMMENT ON COLUMN tenants.deleted_at IS '软删除时间';

CREATE INDEX idx_tenants_status ON tenants (status);
CREATE INDEX idx_tenants_deleted_at ON tenants (deleted_at);
CREATE INDEX idx_tenants_owner_user_id ON tenants (owner_user_id);
CREATE INDEX idx_tenants_parent_id ON tenants(parent_id);
