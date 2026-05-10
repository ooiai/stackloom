-- Create log retention policies table for managing log cleanup settings
CREATE TABLE log_retention_policies (
    id BIGINT PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL UNIQUE,
    -- NULL means keep all logs (no deletion), otherwise number of days to retain
    retention_days INT,
    last_cleanup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_retention_policies_log_type ON log_retention_policies(log_type);
