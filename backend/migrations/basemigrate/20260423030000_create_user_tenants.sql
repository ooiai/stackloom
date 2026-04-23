-- Create user_tenants table only

CREATE TABLE user_tenants (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    display_name VARCHAR(100),
    employee_no VARCHAR(100),
    job_title VARCHAR(100),
    status SMALLINT NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_tenant_admin BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_user_tenants_user_tenant UNIQUE (user_id, tenant_id),
    CONSTRAINT chk_user_tenants_status CHECK (status IN (0, 1, 2))
);

COMMENT ON TABLE user_tenants IS '用户租户成员关系表';

COMMENT ON COLUMN user_tenants.id IS '成员关系ID，主键';
COMMENT ON COLUMN user_tenants.user_id IS '用户ID';
COMMENT ON COLUMN user_tenants.tenant_id IS '租户ID';
COMMENT ON COLUMN user_tenants.display_name IS '用户在该租户中的显示名';
COMMENT ON COLUMN user_tenants.employee_no IS '用户在该租户中的工号';
COMMENT ON COLUMN user_tenants.job_title IS '用户在该租户中的岗位/职称';
COMMENT ON COLUMN user_tenants.status IS '成员状态：0禁用，1正常，2待审核/待加入';
COMMENT ON COLUMN user_tenants.is_default IS '是否为用户默认租户';
COMMENT ON COLUMN user_tenants.is_tenant_admin IS '是否为租户管理员';
COMMENT ON COLUMN user_tenants.joined_at IS '加入租户时间';
COMMENT ON COLUMN user_tenants.invited_by IS '邀请人用户ID';
COMMENT ON COLUMN user_tenants.created_at IS '创建时间';
COMMENT ON COLUMN user_tenants.updated_at IS '更新时间';
COMMENT ON COLUMN user_tenants.deleted_at IS '软删除时间';

CREATE INDEX idx_user_tenants_user_id ON user_tenants (user_id);
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants (tenant_id);
CREATE INDEX idx_user_tenants_status ON user_tenants (status);
CREATE INDEX idx_user_tenants_deleted_at ON user_tenants (deleted_at);

ALTER TABLE user_tenants
    ADD CONSTRAINT fk_user_tenants_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tenants
    ADD CONSTRAINT fk_user_tenants_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE user_tenants
    ADD CONSTRAINT fk_user_tenants_invited_by
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;
