-- Create audit logs table only

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY,
    trace_id VARCHAR(64),
    tenant_id BIGINT,
    operator_id BIGINT,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    action VARCHAR(100) NOT NULL,
    result VARCHAR(32) NOT NULL DEFAULT 'unknown',
    reason TEXT,
    before_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_audit_logs_target_type_not_blank CHECK (btrim(target_type) <> ''),
    CONSTRAINT chk_audit_logs_target_id_not_blank CHECK (btrim(target_id) <> ''),
    CONSTRAINT chk_audit_logs_action_not_blank CHECK (btrim(action) <> ''),
    CONSTRAINT chk_audit_logs_result_not_blank CHECK (btrim(result) <> '')
);

COMMENT ON TABLE audit_logs IS '审计日志表';

COMMENT ON COLUMN audit_logs.id IS '日志ID，主键';
COMMENT ON COLUMN audit_logs.trace_id IS '链路追踪ID';
COMMENT ON COLUMN audit_logs.tenant_id IS '租户ID';
COMMENT ON COLUMN audit_logs.operator_id IS '操作人ID';
COMMENT ON COLUMN audit_logs.target_type IS '审计目标类型';
COMMENT ON COLUMN audit_logs.target_id IS '审计目标标识';
COMMENT ON COLUMN audit_logs.action IS '审计动作';
COMMENT ON COLUMN audit_logs.result IS '执行结果，如success/failure';
COMMENT ON COLUMN audit_logs.reason IS '操作原因';
COMMENT ON COLUMN audit_logs.before_data IS '变更前快照';
COMMENT ON COLUMN audit_logs.after_data IS '变更后快照';
COMMENT ON COLUMN audit_logs.ip IS '请求来源IP';
COMMENT ON COLUMN audit_logs.user_agent IS '请求客户端User-Agent';
COMMENT ON COLUMN audit_logs.created_at IS '创建时间';

CREATE INDEX idx_audit_logs_trace_id ON audit_logs (trace_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_operator_id ON audit_logs (operator_id);
CREATE INDEX idx_audit_logs_target_type ON audit_logs (target_type);
CREATE INDEX idx_audit_logs_target_id ON audit_logs (target_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
