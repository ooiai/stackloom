-- Create menus table only

CREATE TABLE menus (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    parent_id BIGINT,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    path VARCHAR(255),
    component VARCHAR(255),
    redirect VARCHAR(255),
    icon VARCHAR(100),
    menu_type SMALLINT NOT NULL DEFAULT 1,
    sort INT NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    keep_alive BOOLEAN NOT NULL DEFAULT FALSE,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_menus_type CHECK (menu_type IN (1, 2, 3)),
    CONSTRAINT chk_menus_status CHECK (status IN (0, 1))
);

COMMENT ON TABLE menus IS '菜单表';

COMMENT ON COLUMN menus.id IS '菜单ID，主键';
COMMENT ON COLUMN menus.tenant_id IS '所属租户ID，NULL 表示系统级菜单';
COMMENT ON COLUMN menus.parent_id IS '父级菜单ID';
COMMENT ON COLUMN menus.code IS '菜单编码';
COMMENT ON COLUMN menus.name IS '菜单名称';
COMMENT ON COLUMN menus.path IS '前端路由路径';
COMMENT ON COLUMN menus.component IS '前端组件路径';
COMMENT ON COLUMN menus.redirect IS '重定向路由';
COMMENT ON COLUMN menus.icon IS '菜单图标';
COMMENT ON COLUMN menus.menu_type IS '菜单类型：1目录，2菜单，3按钮占位';
COMMENT ON COLUMN menus.sort IS '排序值';
COMMENT ON COLUMN menus.visible IS '是否可见';
COMMENT ON COLUMN menus.keep_alive IS '页面是否缓存';
COMMENT ON COLUMN menus.status IS '菜单状态：0禁用，1正常';
COMMENT ON COLUMN menus.created_at IS '创建时间';
COMMENT ON COLUMN menus.updated_at IS '更新时间';
COMMENT ON COLUMN menus.deleted_at IS '软删除时间';

CREATE UNIQUE INDEX uq_menus_tenant_code
    ON menus (tenant_id, code)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_menus_system_code
    ON menus (code)
    WHERE tenant_id IS NULL;

CREATE INDEX idx_menus_tenant_id ON menus (tenant_id);
CREATE INDEX idx_menus_parent_id ON menus (parent_id);
CREATE INDEX idx_menus_status ON menus (status);
CREATE INDEX idx_menus_deleted_at ON menus (deleted_at);
