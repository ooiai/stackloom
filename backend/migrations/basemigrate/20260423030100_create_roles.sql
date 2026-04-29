-- Create roles table only

CREATE TABLE roles (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status SMALLINT NOT NULL DEFAULT 1,
    is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
    sort INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_roles_status CHECK (status IN (0, 1))
);

COMMENT ON TABLE roles IS '角色表';

COMMENT ON COLUMN roles.id IS '角色ID，主键';
COMMENT ON COLUMN roles.tenant_id IS '所属租户ID，NULL 表示系统级角色';
COMMENT ON COLUMN roles.code IS '角色编码';
COMMENT ON COLUMN roles.name IS '角色名称';
COMMENT ON COLUMN roles.description IS '角色描述';
COMMENT ON COLUMN roles.status IS '角色状态：0禁用，1正常';
COMMENT ON COLUMN roles.is_builtin IS '是否内置角色';
COMMENT ON COLUMN roles.sort IS '排序值';
COMMENT ON COLUMN roles.created_at IS '创建时间';
COMMENT ON COLUMN roles.updated_at IS '更新时间';
COMMENT ON COLUMN roles.deleted_at IS '软删除时间';

CREATE UNIQUE INDEX uq_roles_tenant_code
    ON roles (tenant_id, code)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_roles_system_code
    ON roles (code)
    WHERE tenant_id IS NULL;

CREATE INDEX idx_roles_tenant_id ON roles (tenant_id);
CREATE INDEX idx_roles_status ON roles (status);
CREATE INDEX idx_roles_deleted_at ON roles (deleted_at);
