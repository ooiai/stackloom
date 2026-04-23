-- Add migration script here
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(100),
    avatar_url TEXT,
    gender SMALLINT NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    bio TEXT,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_gender CHECK (gender IN (0, 1, 2)),
    CONSTRAINT chk_users_status CHECK (status IN (0, 1, 2))
);

COMMENT ON TABLE users IS '用户表';

COMMENT ON COLUMN users.id IS '用户ID，主键';
COMMENT ON COLUMN users.username IS '用户名，唯一';
COMMENT ON COLUMN users.email IS '邮箱，唯一，可为空';
COMMENT ON COLUMN users.phone IS '手机号，唯一，可为空';
COMMENT ON COLUMN users.password_hash IS '密码哈希，不存明文密码';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.avatar_url IS '头像地址';
COMMENT ON COLUMN users.gender IS '性别：0未知，1男，2女';
COMMENT ON COLUMN users.status IS '状态：0禁用，1正常，2锁定';
COMMENT ON COLUMN users.bio IS '个人简介';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.last_login_ip IS '最后登录IP';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.deleted_at IS '软删除时间';

CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);
