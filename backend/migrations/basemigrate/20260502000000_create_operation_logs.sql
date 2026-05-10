-- Create operation_logs table only

CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    operator_id BIGINT,
    module VARCHAR(100) NOT NULL,
    biz_type VARCHAR(100) NOT NULL,
    biz_id BIGINT,
    operation VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    result SMALLINT NOT NULL DEFAULT 1,
    before_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    trace_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_operation_logs_module CHECK (BTRIM(module) <> ''),
    CONSTRAINT chk_operation_logs_biz_type CHECK (BTRIM(biz_type) <> ''),
    CONSTRAINT chk_operation_logs_operation CHECK (BTRIM(operation) <> ''),
    CONSTRAINT chk_operation_logs_summary CHECK (BTRIM(summary) <> ''),
    CONSTRAINT chk_operation_logs_result CHECK (result IN (0, 1)),
    CONSTRAINT chk_operation_logs_before_snapshot CHECK (jsonb_typeof(before_snapshot) = 'object'),
    CONSTRAINT chk_operation_logs_after_snapshot CHECK (jsonb_typeof(after_snapshot) = 'object'),
    CONSTRAINT chk_operation_logs_trace_id CHECK (trace_id IS NULL OR BTRIM(trace_id) <> '')
);

COMMENT ON TABLE operation_logs IS '操作日志表';

COMMENT ON COLUMN operation_logs.id IS '操作日志ID，主键，使用 sonyflake 生成';
COMMENT ON COLUMN operation_logs.tenant_id IS '所属租户ID，可为空';
COMMENT ON COLUMN operation_logs.operator_id IS '操作人ID，可为空';
COMMENT ON COLUMN operation_logs.module IS '所属业务模块，如 users、roles';
COMMENT ON COLUMN operation_logs.biz_type IS '业务类型，如 user、role';
COMMENT ON COLUMN operation_logs.biz_id IS '业务对象ID，可为空';
COMMENT ON COLUMN operation_logs.operation IS '操作类型，如 create、update、delete';
COMMENT ON COLUMN operation_logs.summary IS '操作摘要';
COMMENT ON COLUMN operation_logs.result IS '操作结果：0失败，1成功';
COMMENT ON COLUMN operation_logs.before_snapshot IS '操作前快照，JSON 对象';
COMMENT ON COLUMN operation_logs.after_snapshot IS '操作后快照，JSON 对象';
COMMENT ON COLUMN operation_logs.trace_id IS '链路追踪ID，可为空';
COMMENT ON COLUMN operation_logs.created_at IS '创建时间';

CREATE INDEX idx_operation_logs_tenant_id ON operation_logs (tenant_id);
CREATE INDEX idx_operation_logs_operator_id ON operation_logs (operator_id);
CREATE INDEX idx_operation_logs_module ON operation_logs (module);
CREATE INDEX idx_operation_logs_biz_type ON operation_logs (biz_type);
CREATE INDEX idx_operation_logs_biz_id ON operation_logs (biz_id);
CREATE INDEX idx_operation_logs_operation ON operation_logs (operation);
CREATE INDEX idx_operation_logs_trace_id ON operation_logs (trace_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs (created_at);
