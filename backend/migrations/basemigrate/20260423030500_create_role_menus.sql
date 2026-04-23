-- Create role_menus table only

CREATE TABLE role_menus (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_menus UNIQUE (role_id, menu_id)
);

COMMENT ON TABLE role_menus IS '角色菜单关联表';

COMMENT ON COLUMN role_menus.id IS '关联ID，主键';
COMMENT ON COLUMN role_menus.role_id IS '角色ID';
COMMENT ON COLUMN role_menus.menu_id IS '菜单ID';
COMMENT ON COLUMN role_menus.created_at IS '创建时间';

CREATE INDEX idx_role_menus_role_id ON role_menus (role_id);
CREATE INDEX idx_role_menus_menu_id ON role_menus (menu_id);

ALTER TABLE role_menus
    ADD CONSTRAINT fk_role_menus_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_menus
    ADD CONSTRAINT fk_role_menus_menu
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE;
