-- Change ip column from INET to TEXT
-- INET is not directly compatible with Rust's String/Option<String> via sqlx.
-- Using TEXT avoids per-query CAST and lets sqlx bind/decode IP strings natively.

ALTER TABLE system_logs
    ALTER COLUMN ip TYPE TEXT USING ip::TEXT;
