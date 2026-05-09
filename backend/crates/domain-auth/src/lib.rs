pub mod repo;
pub mod service;

pub use repo::AuthRepository;
pub use service::AuthService;

use domain_base::{Tenant, User, UserTenant, UserTenantRole};
use neocrates::response::error::{AppError, AppResult};

/// Domain projection for an auth-capable user account.
///
/// It is used by signin and signup flows to validate account identity,
/// password hashes, and availability status.
#[derive(Debug, Clone)]
pub struct AuthUserAccount {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub password_hash: String,
    pub status: i16,
}

/// Lightweight tenant projection used to detect signup conflicts.
#[derive(Debug, Clone)]
pub struct AuthTenantConflict {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

/// Tenant membership option returned by the first signin step.
///
/// One user may belong to multiple tenants, so the API first returns a list
/// of selectable memberships and roles before issuing the final auth token.
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

/// Domain command for the signin preflight step.
///
/// The service validates the account credentials and captcha, then loads the
/// tenant memberships that can be used for final signin.
#[derive(Debug, Clone)]
pub struct QuerySigninTenantsCmd {
    pub account: String,
    pub password: String,
    pub code: String,
}

impl QuerySigninTenantsCmd {
    /// Validate the command before it enters the domain service.
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
            return Err(AppError::ValidationError(
                "code cannot be empty".to_string(),
            ));
        }
        Ok(())
    }
}

/// Domain command for the final signin step.
///
/// Besides account credentials and captcha data, it also carries the selected
/// membership and tenant ids chosen by the user during the preflight step.
#[derive(Debug, Clone)]
pub struct AccountSigninCmd {
    pub account: String,
    pub password: String,
    pub code: String,
    pub membership_id: i64,
    pub tenant_id: i64,
}

impl AccountSigninCmd {
    /// Validate the final signin payload, including membership selection.
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

/// Domain command for access token refresh.
#[derive(Debug, Clone)]
pub struct RefreshAuthCmd {
    pub access_token: String,
    pub refresh_token: String,
}

impl RefreshAuthCmd {
    /// Validate the refresh payload.
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecoveryChannel {
    Phone,
    Email,
}

impl RecoveryChannel {
    pub fn parse(value: &str) -> AppResult<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "phone" => Ok(Self::Phone),
            "email" => Ok(Self::Email),
            _ => Err(AppError::ValidationError(
                "channel must be one of: phone, email".to_string(),
            )),
        }
    }
}

#[derive(Debug, Clone)]
pub struct SendPasswordResetCodeCmd {
    pub channel: RecoveryChannel,
    pub account: String,
    pub code: String,
}

impl SendPasswordResetCodeCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.account.trim().is_empty() {
            return Err(AppError::ValidationError(
                "account cannot be empty".to_string(),
            ));
        }
        if self.code.trim().is_empty() {
            return Err(AppError::ValidationError(
                "code cannot be empty".to_string(),
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct ResetPasswordCmd {
    pub channel: RecoveryChannel,
    pub account: String,
    pub captcha: String,
    pub new_password: String,
}

impl ResetPasswordCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.account.trim().is_empty() {
            return Err(AppError::ValidationError(
                "account cannot be empty".to_string(),
            ));
        }
        if self.captcha.trim().is_empty() {
            return Err(AppError::ValidationError(
                "captcha cannot be empty".to_string(),
            ));
        }
        if self.new_password.trim().len() < 8 {
            return Err(AppError::ValidationError(
                "new_password must be at least 8 characters".to_string(),
            ));
        }
        Ok(())
    }
}

/// Domain command for self-service signup.
///
/// The signup flow creates a user, tenant, default role, and initial
/// membership in one coordinated operation.
#[derive(Debug, Clone)]
pub struct AccountSignupCmd {
    pub account: String,
    pub password: String,
    pub code: String,
    pub nickname: Option<String>,
    pub tenant_name: Option<String>,
}

impl AccountSignupCmd {
    /// Validate the signup payload before persistence and token-related work.
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
            return Err(AppError::ValidationError(
                "code cannot be empty".to_string(),
            ));
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

/// Result returned when self-service signup succeeds.
#[derive(Debug, Clone)]
pub struct AccountSignupResult {
    pub account: String,
    pub username: String,
    pub tenant_name: String,
    pub tenant_slug: String,
}

/// Auth token pair used by signin and refresh flows.
#[derive(Debug, Clone)]
pub struct AuthToken {
    pub access_token: String,
    pub expires_at: u64,
    pub refresh_token: String,
    pub refresh_expires_at: u64,
}

/// Convert the middleware-layer token payload into the domain token model.
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

/// Aggregate persisted during self-service signup.
///
/// Infra stores all newly created records in one database transaction so the
/// signup flow either succeeds as a whole or fails without partial side effects.
///
/// The signup role template is loaded separately and referenced by
/// `user_tenant_role.role_id`; it is not created during signup.
#[derive(Debug, Clone)]
pub struct AccountSignupBundle {
    pub user: User,
    pub tenant: Tenant,
    pub user_tenant: UserTenant,
    pub user_tenant_role: UserTenantRole,
}
