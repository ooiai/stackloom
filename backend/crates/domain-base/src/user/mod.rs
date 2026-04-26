pub mod repo;
pub mod service;

pub use repo::UserRepository;
pub use service::UserService;

use chrono::{DateTime, Utc};

use neocrates::response::error::AppResult;

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
    pub fn new(cmd: CreateUserCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
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
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateUserCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(email) = cmd.email {
            self.email = email;
        }

        if let Some(phone) = cmd.phone {
            self.phone = phone;
        }

        if let Some(nickname) = cmd.nickname {
            self.nickname = nickname;
        }

        if let Some(avatar_url) = cmd.avatar_url {
            self.avatar_url = avatar_url;
        }

        if let Some(gender) = cmd.gender {
            self.gender = gender;
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(bio) = cmd.bio {
            self.bio = bio;
        }

        self.updated_at = Utc::now();
        Ok(())
    }

    pub fn mark_deleted(&mut self) {
        let now = Utc::now();
        self.deleted_at = Some(now);
        self.updated_at = now;
    }

    pub fn validate_gender(value: i16) -> AppResult<()> {
        match value {
            0 | 1 | 2 => Ok(()),
            _ => Err(neocrates::response::error::AppError::ValidationError(
                format!("invalid gender value: {value}"),
            )),
        }
    }

    pub fn validate_status(value: i16) -> AppResult<()> {
        match value {
            0 | 1 | 2 => Ok(()),
            _ => Err(neocrates::response::error::AppError::ValidationError(
                format!("invalid status value: {value}"),
            )),
        }
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

impl CreateUserCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.username.trim().is_empty() {
            return Err(neocrates::response::error::AppError::ValidationError(
                "username cannot be empty".to_string(),
            ));
        }

        if self.password_hash.trim().is_empty() {
            return Err(neocrates::response::error::AppError::ValidationError(
                "password_hash cannot be empty".to_string(),
            ));
        }

        User::validate_gender(self.gender)?;
        User::validate_status(self.status)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateUserCmd {
    pub email: Option<Option<String>>,
    pub phone: Option<Option<String>>,
    pub nickname: Option<Option<String>>,
    pub avatar_url: Option<Option<String>>,
    pub gender: Option<i16>,
    pub status: Option<i16>,
    pub bio: Option<Option<String>>,
}

impl UpdateUserCmd {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(gender) = self.gender {
            User::validate_gender(gender)?;
        }

        if let Some(status) = self.status {
            User::validate_status(status)?;
        }

        Ok(())
    }
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
