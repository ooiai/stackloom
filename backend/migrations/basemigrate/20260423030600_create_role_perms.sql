-- Create role_perms table only

CREATE TABLE role_perms (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    perm_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_perms UNIQUE (role_id, perm_id)
);

COMMENT ON TABLE role_perms IS '角色权限关联表';

COMMENT ON COLUMN role_perms.id IS '关联ID，主键';
COMMENT ON COLUMN role_perms.role_id IS '角色ID';
COMMENT ON COLUMN role_perms.perm_id IS '权限点ID';
COMMENT ON COLUMN role_perms.created_at IS '创建时间';

CREATE INDEX idx_role_perms_role_id ON role_perms (role_id);
CREATE INDEX idx_role_perms_perm_id ON role_perms (perm_id);
