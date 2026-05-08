-- Create system logs table only

CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY,
    trace_id VARCHAR(64),
    request_id VARCHAR(64),
    tenant_id BIGINT,
    operator_id BIGINT,
    method VARCHAR(16) NOT NULL,
    path VARCHAR(512) NOT NULL,
    module VARCHAR(100),
    action VARCHAR(100),
    status_code INTEGER NOT NULL DEFAULT 0,
    latency_ms BIGINT NOT NULL DEFAULT 0,
    result VARCHAR(32) NOT NULL DEFAULT 'unknown',
    error_code VARCHAR(100),
    error_message TEXT,
    ip TEXT,
    user_agent TEXT,
    ext JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_system_logs_method_not_blank CHECK (btrim(method) <> ''),
    CONSTRAINT chk_system_logs_path_not_blank CHECK (btrim(path) <> ''),
    CONSTRAINT chk_system_logs_result_not_blank CHECK (btrim(result) <> ''),
    CONSTRAINT chk_system_logs_status_code CHECK (status_code >= 0),
    CONSTRAINT chk_system_logs_latency_ms CHECK (latency_ms >= 0)
);

COMMENT ON TABLE system_logs IS '系统请求日志表';

COMMENT ON COLUMN system_logs.id IS '日志ID，主键';
COMMENT ON COLUMN system_logs.trace_id IS '链路追踪ID';
COMMENT ON COLUMN system_logs.request_id IS '请求ID';
COMMENT ON COLUMN system_logs.tenant_id IS '租户ID';
COMMENT ON COLUMN system_logs.operator_id IS '操作人ID';
COMMENT ON COLUMN system_logs.method IS 'HTTP请求方法';
COMMENT ON COLUMN system_logs.path IS 'HTTP请求路径';
COMMENT ON COLUMN system_logs.module IS '业务模块';
COMMENT ON COLUMN system_logs.action IS '业务动作';
COMMENT ON COLUMN system_logs.status_code IS 'HTTP状态码';
COMMENT ON COLUMN system_logs.latency_ms IS '请求耗时，单位毫秒';
COMMENT ON COLUMN system_logs.result IS '执行结果，如success/failure';
COMMENT ON COLUMN system_logs.error_code IS '业务错误码';
COMMENT ON COLUMN system_logs.error_message IS '错误信息';
COMMENT ON COLUMN system_logs.ip IS '请求来源IP';
COMMENT ON COLUMN system_logs.user_agent IS '请求客户端User-Agent';
COMMENT ON COLUMN system_logs.ext IS '扩展上下文信息';
COMMENT ON COLUMN system_logs.created_at IS '创建时间';

CREATE INDEX idx_system_logs_trace_id ON system_logs (trace_id);
CREATE INDEX idx_system_logs_request_id ON system_logs (request_id);
CREATE INDEX idx_system_logs_tenant_id ON system_logs (tenant_id);
CREATE INDEX idx_system_logs_operator_id ON system_logs (operator_id);
CREATE INDEX idx_system_logs_path ON system_logs (path);
CREATE INDEX idx_system_logs_module ON system_logs (module);
CREATE INDEX idx_system_logs_action ON system_logs (action);
CREATE INDEX idx_system_logs_created_at ON system_logs (created_at DESC);
