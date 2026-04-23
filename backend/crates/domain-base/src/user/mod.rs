pub mod repo;
pub mod service;

pub use repo::UserRepository;
pub use service::UserService;

use chrono::{DateTime, Utc};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UserDomainError {
    UsernameEmpty,
    PasswordHashEmpty,
    InvalidGender(i16),
    InvalidStatus(i16),
    UserNotFound(i64),
    Conflict(String),
    Persistence(String),
}

impl std::fmt::Display for UserDomainError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UsernameEmpty => write!(f, "username cannot be empty"),
            Self::PasswordHashEmpty => write!(f, "password_hash cannot be empty"),
            Self::InvalidGender(value) => write!(f, "invalid gender value: {value}"),
            Self::InvalidStatus(value) => write!(f, "invalid status value: {value}"),
            Self::UserNotFound(id) => write!(f, "user not found: {id}"),
            Self::Conflict(message) => write!(f, "conflict: {message}"),
            Self::Persistence(message) => write!(f, "persistence error: {message}"),
        }
    }
}

impl std::error::Error for UserDomainError {}

pub type UserDomainResult<T> = Result<T, UserDomainError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub password_hash: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: i16,
    pub status: i16,
    pub bio: Option<String>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub last_login_ip: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl User {
    pub fn new(cmd: CreateUserCmd) -> Self {
        let now = Utc::now();

        Self {
            id: cmd.id,
            username: cmd.username,
            email: cmd.email,
            phone: cmd.phone,
            password_hash: cmd.password_hash,
            nickname: cmd.nickname,
            avatar_url: cmd.avatar_url,
            gender: cmd.gender,
            status: cmd.status,
            bio: cmd.bio,
            last_login_at: None,
            last_login_ip: None,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        }
    }

    pub fn apply_update(&mut self, cmd: UpdateUserCmd) {
        if let Some(email) = cmd.email {
            self.email = Some(email);
        }

        if let Some(phone) = cmd.phone {
            self.phone = Some(phone);
        }

        if let Some(nickname) = cmd.nickname {
            self.nickname = Some(nickname);
        }

        if let Some(avatar_url) = cmd.avatar_url {
            self.avatar_url = Some(avatar_url);
        }

        if let Some(gender) = cmd.gender {
            self.gender = gender;
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(bio) = cmd.bio {
            self.bio = Some(bio);
        }

        self.updated_at = Utc::now();
    }

    pub fn mark_deleted(&mut self) {
        let now = Utc::now();
        self.deleted_at = Some(now);
        self.updated_at = now;
    }
}

#[derive(Debug, Clone)]
pub struct CreateUserCmd {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub password_hash: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: i16,
    pub status: i16,
    pub bio: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateUserCmd {
    pub email: Option<String>,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<i16>,
    pub status: Option<i16>,
    pub bio: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct PageUserCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct UserPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
