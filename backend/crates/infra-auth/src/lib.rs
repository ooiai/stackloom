pub mod repo;
pub mod service;

pub use repo::SqlxAuthRepository;
pub use service::AuthServiceImpl;

use domain_auth::{AuthTenantConflict, AuthUserAccount};
use neocrates::sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct AuthUserAccountRow {
    pub id: i64,
    pub username: String,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub password_hash: String,
    pub status: i16,
}

impl From<AuthUserAccountRow> for AuthUserAccount {
    fn from(value: AuthUserAccountRow) -> Self {
        Self {
            id: value.id,
            username: value.username,
            phone: value.phone,
            nickname: value.nickname,
            password_hash: value.password_hash,
            status: value.status,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct AuthTenantConflictRow {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

impl From<AuthTenantConflictRow> for AuthTenantConflict {
    fn from(value: AuthTenantConflictRow) -> Self {
        Self {
            id: value.id,
            slug: value.slug,
            name: value.name,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct SigninTenantMembershipRow {
    pub membership_id: i64,
    pub tenant_id: i64,
    pub tenant_name: String,
    pub display_name: Option<String>,
    pub status: i16,
    pub user_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub role_id: Option<i64>,
    pub role_name: Option<String>,
    pub role_code: Option<String>,
}
