-- Create perms table only

CREATE TABLE perms (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    code VARCHAR(150) NOT NULL,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    action VARCHAR(100),
    method VARCHAR(16),
    description TEXT,
    status SMALLINT NOT NULL DEFAULT 1,
    parent_id BIGINT,
    sort INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_perms_status CHECK (status IN (0, 1))
);

COMMENT ON TABLE perms IS '权限点表';

COMMENT ON COLUMN perms.id IS '权限点ID，主键';
COMMENT ON COLUMN perms.tenant_id IS '所属租户ID，NULL 表示系统级权限';
COMMENT ON COLUMN perms.code IS '权限编码，如 user:create';
COMMENT ON COLUMN perms.name IS '权限名称';
COMMENT ON COLUMN perms.resource IS '资源标识，如 user';
COMMENT ON COLUMN perms.action IS '动作标识，如 create';
COMMENT ON COLUMN perms.method IS 'HTTP 方法元数据，仅用于展示/审计；权限校验仍以 code 为准';
COMMENT ON COLUMN perms.description IS '权限描述';
COMMENT ON COLUMN perms.status IS '权限状态：0禁用，1正常';
COMMENT ON COLUMN perms.parent_id IS '父权限ID，NULL 表示根权限';
COMMENT ON COLUMN perms.sort IS '排序值';
COMMENT ON COLUMN perms.created_at IS '创建时间';
COMMENT ON COLUMN perms.updated_at IS '更新时间';
COMMENT ON COLUMN perms.deleted_at IS '软删除时间';

CREATE UNIQUE INDEX uq_perms_tenant_code
    ON perms (tenant_id, code)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_perms_system_code
    ON perms (code)
    WHERE tenant_id IS NULL;

CREATE INDEX idx_perms_tenant_id ON perms (tenant_id);
CREATE INDEX idx_perms_parent_id ON perms (parent_id);
CREATE INDEX idx_perms_status ON perms (status);
CREATE INDEX idx_perms_deleted_at ON perms (deleted_at);
