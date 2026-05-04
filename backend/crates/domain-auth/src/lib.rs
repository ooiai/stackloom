pub mod repo;
pub mod service;

pub use repo::AuthRepository;
pub use service::AuthService;

use domain_base::{Role, Tenant, User, UserTenant, UserTenantRole};
use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct AuthUserAccount {
    pub id: i64,
    pub username: String,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub password_hash: String,
    pub status: i16,
}

#[derive(Debug, Clone)]
pub struct AuthTenantConflict {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

#[derive(Debug, Clone, Default)]
pub struct SigninTenantOption {
    pub membership_id: i64,
    pub tenant_id: i64,
    pub tenant_name: String,
    pub display_name: Option<String>,
    pub status: i16,
    pub user_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub role_ids: Vec<i64>,
    pub role_names: Vec<String>,
    pub role_codes: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct QuerySigninTenantsCmd {
    pub account: String,
    pub password: String,
    pub code: String,
}

impl QuerySigninTenantsCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.account.trim().is_empty() {
            return Err(AppError::ValidationError(
                "account cannot be empty".to_string(),
            ));
        }
        if self.password.trim().is_empty() {
            return Err(AppError::ValidationError(
                "password cannot be empty".to_string(),
            ));
        }
        if self.code.trim().is_empty() {
            return Err(AppError::ValidationError("code cannot be empty".to_string()));
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct AccountSigninCmd {
    pub account: String,
    pub password: String,
    pub code: String,
    pub membership_id: i64,
    pub tenant_id: i64,
}

impl AccountSigninCmd {
    pub fn validate(&self) -> AppResult<()> {
        QuerySigninTenantsCmd {
            account: self.account.clone(),
            password: self.password.clone(),
            code: self.code.clone(),
        }
        .validate()?;

        if self.membership_id <= 0 {
            return Err(AppError::ValidationError(
                "membership_id must be greater than 0".to_string(),
            ));
        }
        if self.tenant_id <= 0 {
            return Err(AppError::ValidationError(
                "tenant_id must be greater than 0".to_string(),
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct RefreshAuthCmd {
    pub access_token: String,
    pub refresh_token: String,
}

impl RefreshAuthCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.access_token.trim().is_empty() {
            return Err(AppError::ValidationError(
                "access_token cannot be empty".to_string(),
            ));
        }
        if self.refresh_token.trim().is_empty() {
            return Err(AppError::ValidationError(
                "refresh_token cannot be empty".to_string(),
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct SignupCmd {
    pub account: String,
    pub password: String,
    pub code: String,
    pub nickname: Option<String>,
    pub tenant_name: Option<String>,
}

impl SignupCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.account.trim().is_empty() {
            return Err(AppError::ValidationError(
                "account cannot be empty".to_string(),
            ));
        }
        if self.password.trim().is_empty() {
            return Err(AppError::ValidationError(
                "password cannot be empty".to_string(),
            ));
        }
        if self.code.trim().is_empty() {
            return Err(AppError::ValidationError("code cannot be empty".to_string()));
        }

        if let Some(nickname) = self.nickname.as_ref() {
            if nickname.trim().len() > 100 {
                return Err(AppError::ValidationError(
                    "nickname length must be less than or equal to 100".to_string(),
                ));
            }
        }

        if let Some(tenant_name) = self.tenant_name.as_ref() {
            if tenant_name.trim().len() > 255 {
                return Err(AppError::ValidationError(
                    "tenant_name length must be less than or equal to 255".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct SignupResult {
    pub account: String,
    pub username: String,
    pub tenant_name: String,
    pub tenant_slug: String,
}

#[derive(Debug, Clone)]
pub struct AuthToken {
    pub access_token: String,
    pub expires_at: u64,
    pub refresh_token: String,
    pub refresh_expires_at: u64,
}

impl From<neocrates::middlewares::models::AuthTokenResult> for AuthToken {
    fn from(value: neocrates::middlewares::models::AuthTokenResult) -> Self {
        Self {
            access_token: value.access_token,
            expires_at: value.expires_at,
            refresh_token: value.refresh_token,
            refresh_expires_at: value.refresh_expires_at,
        }
    }
}

#[derive(Debug, Clone)]
pub struct SignupBundle {
    pub user: User,
    pub tenant: Tenant,
    pub role: Role,
    pub user_tenant: UserTenant,
    pub user_tenant_role: UserTenantRole,
}
