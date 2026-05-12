pub mod oauth;
pub mod repo;
pub mod service;

pub use oauth::{
    GitHubOAuthProvider, GoogleOAuthProvider, OAuthServiceImpl, SqlxOAuthRepository,
    WeChatOAuthProvider,
};
pub use domain_auth::oauth::OAuthProvider;
pub use repo::SqlxAuthRepository;
pub use service::AuthServiceImpl;

use domain_auth::{AuthTenantConflict, AuthTenantSummary, AuthUserAccount};
use neocrates::sqlx::FromRow;

/// Database row used to hydrate the domain auth account projection.
#[derive(Debug, Clone, FromRow)]
pub struct AuthUserAccountRow {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub password_hash: String,
    pub status: i16,
}

/// Convert the SQL row into the domain model used by signin/signup services.
impl From<AuthUserAccountRow> for AuthUserAccount {
    fn from(value: AuthUserAccountRow) -> Self {
        Self {
            id: value.id,
            username: value.username,
            email: value.email,
            phone: value.phone,
            nickname: value.nickname,
            password_hash: value.password_hash,
            status: value.status,
        }
    }
}

/// Database row used to detect tenant slug or name conflicts during signup.
#[derive(Debug, Clone, FromRow)]
pub struct AuthTenantConflictRow {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

/// Convert the SQL row into the domain conflict projection.
impl From<AuthTenantConflictRow> for AuthTenantConflict {
    fn from(value: AuthTenantConflictRow) -> Self {
        Self {
            id: value.id,
            slug: value.slug,
            name: value.name,
        }
    }
}

/// Convert the SQL row into the tenant summary used by invite flows.
impl From<AuthTenantConflictRow> for AuthTenantSummary {
    fn from(value: AuthTenantConflictRow) -> Self {
        Self {
            id: value.id,
            slug: value.slug,
            name: value.name,
        }
    }
}

/// Flat SQL row representing one signin membership and an optional role.
///
/// Repository code folds multiple rows with the same membership id into a single
/// `SigninTenantOption` containing deduplicated role ids, names, and codes.
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
