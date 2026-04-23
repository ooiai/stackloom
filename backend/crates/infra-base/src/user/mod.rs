pub mod repo;
pub mod service;

pub use repo::SqlxUserRepository;
pub use service::UserServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::User;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct UserRow {
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

impl From<UserRow> for User {
    fn from(row: UserRow) -> Self {
        Self {
            id: row.id,
            username: row.username,
            email: row.email,
            phone: row.phone,
            password_hash: row.password_hash,
            nickname: row.nickname,
            avatar_url: row.avatar_url,
            gender: row.gender,
            status: row.status,
            bio: row.bio,
            last_login_at: row.last_login_at,
            last_login_ip: row.last_login_ip,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}
