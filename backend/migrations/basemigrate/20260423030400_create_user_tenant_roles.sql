-- Create user_tenant_roles table only

CREATE TABLE user_tenant_roles (
    id BIGINT PRIMARY KEY,
    user_tenant_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tenant_roles UNIQUE (user_tenant_id, role_id)
);

COMMENT ON TABLE user_tenant_roles IS '租户成员角色关联表';

COMMENT ON COLUMN user_tenant_roles.id IS '关联ID，主键';
COMMENT ON COLUMN user_tenant_roles.user_tenant_id IS '用户租户成员关系ID';
COMMENT ON COLUMN user_tenant_roles.role_id IS '角色ID';
COMMENT ON COLUMN user_tenant_roles.created_at IS '创建时间';

CREATE INDEX idx_user_tenant_roles_user_tenant_id ON user_tenant_roles (user_tenant_id);
CREATE INDEX idx_user_tenant_roles_role_id ON user_tenant_roles (role_id);

ALTER TABLE user_tenant_roles
    ADD CONSTRAINT fk_user_tenant_roles_user_tenant
    FOREIGN KEY (user_tenant_id) REFERENCES user_tenants(id) ON DELETE CASCADE;

ALTER TABLE user_tenant_roles
    ADD CONSTRAINT fk_user_tenant_roles_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
