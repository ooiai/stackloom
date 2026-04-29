-- Create dicts table only

CREATE TABLE dicts (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    parent_id BIGINT,
    dict_type VARCHAR(100) NOT NULL,
    dict_key VARCHAR(100) NOT NULL,
    dict_value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    value_type VARCHAR(50) NOT NULL DEFAULT 'string',
    description TEXT,
    sort INT NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
    is_leaf BOOLEAN NOT NULL DEFAULT TRUE,
    ext JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_dicts_status CHECK (status IN (0, 1)),
    CONSTRAINT chk_dicts_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'json'))
);

COMMENT ON TABLE dicts IS '字典表';

COMMENT ON COLUMN dicts.id IS '字典ID，主键，使用 snowflake/sonyflake 生成';
COMMENT ON COLUMN dicts.tenant_id IS '所属租户ID，NULL 表示系统级字典';
COMMENT ON COLUMN dicts.parent_id IS '父级字典ID，用于树形字典';
COMMENT ON COLUMN dicts.dict_type IS '字典类型编码，如 gender、status、tenant_plan';
COMMENT ON COLUMN dicts.dict_key IS '字典项键，如 male、enabled、pro';
COMMENT ON COLUMN dicts.dict_value IS '字典项值，统一按字符串存储';
COMMENT ON COLUMN dicts.label IS '字典项显示名称';
COMMENT ON COLUMN dicts.value_type IS '字典值类型：string、number、boolean、json';
COMMENT ON COLUMN dicts.description IS '字典描述';
COMMENT ON COLUMN dicts.sort IS '排序值';
COMMENT ON COLUMN dicts.status IS '状态：0禁用，1正常';
COMMENT ON COLUMN dicts.is_builtin IS '是否为内置字典项';
COMMENT ON COLUMN dicts.is_leaf IS '是否叶子节点';
COMMENT ON COLUMN dicts.ext IS '扩展字段，存储额外配置';
COMMENT ON COLUMN dicts.created_at IS '创建时间';
COMMENT ON COLUMN dicts.updated_at IS '更新时间';
COMMENT ON COLUMN dicts.deleted_at IS '软删除时间';

CREATE UNIQUE INDEX uq_dicts_tenant_type_key
    ON dicts (tenant_id, dict_type, dict_key)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_dicts_system_type_key
    ON dicts (dict_type, dict_key)
    WHERE tenant_id IS NULL;

CREATE INDEX idx_dicts_tenant_id ON dicts (tenant_id);
CREATE INDEX idx_dicts_parent_id ON dicts (parent_id);
CREATE INDEX idx_dicts_dict_type ON dicts (dict_type);
CREATE INDEX idx_dicts_status ON dicts (status);
CREATE INDEX idx_dicts_sort ON dicts (sort);
CREATE INDEX idx_dicts_deleted_at ON dicts (deleted_at);
