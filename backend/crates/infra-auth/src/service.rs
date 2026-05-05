use std::sync::Arc;

use chrono::Utc;
use domain_auth::{
    AccountSigninCmd, AccountSignupBundle, AccountSignupCmd, AccountSignupResult, AuthRepository,
    AuthService, AuthToken, QuerySigninTenantsCmd, RefreshAuthCmd,
};
use domain_base::{
    CreateRoleCmd, CreateTenantCmd, CreateUserCmd, CreateUserTenantCmd, CreateUserTenantRoleCmd,
    Role, Tenant, User, UserTenant, UserTenantRole,
};
use neocrates::{
    async_trait::async_trait,
    auth::auth_helper::AuthHelper,
    captcha::CaptchaService,
    crypto::core::Crypto,
    helper::core::snowflake::generate_sonyflake_id,
    middlewares::models::AuthModel,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxAuthRepository;

/// Default role code assigned to the tenant created during self-service signup.
const DEFAULT_GUEST_ROLE_CODE: &str = "WEB::GUEST";
/// Default role name assigned to the tenant created during self-service signup.
const DEFAULT_GUEST_ROLE_NAME: &str = "Web Guest";

/// Infra implementation of the auth domain service.
///
/// It coordinates captcha validation, credential checks, token issuing,
/// tenant conflict detection, and transactional signup persistence.
#[derive(Clone)]
pub struct AuthServiceImpl<R>
where
    R: AuthRepository,
{
    repository: Arc<R>,
    redis_pool: Arc<RedisPool>,
    prefix: String,
    expires_at: u64,
    refresh_expires_at: u64,
}

impl AuthServiceImpl<SqlxAuthRepository> {
    /// Build the default auth service backed by the SQL repository.
    pub fn new(
        pool: Arc<SqlxPool>,
        redis_pool: Arc<RedisPool>,
        prefix: String,
        expires_at: u64,
        refresh_expires_at: u64,
    ) -> Self {
        Self {
            repository: Arc::new(SqlxAuthRepository::new(pool)),
            redis_pool,
            prefix,
            expires_at,
            refresh_expires_at,
        }
    }
}

impl<R> AuthServiceImpl<R>
where
    R: AuthRepository,
{
    /// Build the service with a caller-provided repository, mainly for tests or composition.
    pub fn with_repository(
        repository: Arc<R>,
        redis_pool: Arc<RedisPool>,
        prefix: String,
        expires_at: u64,
        refresh_expires_at: u64,
    ) -> Self {
        Self {
            repository,
            redis_pool,
            prefix,
            expires_at,
            refresh_expires_at,
        }
    }

    /// Validate the slider captcha bound to the account.
    ///
    /// The `delete` flag controls whether the captcha proof should be consumed
    /// immediately after verification.
    async fn validate_slider_captcha(
        &self,
        account: &str,
        code: &str,
        delete: bool,
    ) -> AppResult<()> {
        CaptchaService::captcha_slider_valid(&self.redis_pool, &self.prefix, code, account, delete)
            .await
    }

    /// Load one user by account and verify that the password and status are valid.
    async fn load_enabled_user(
        &self,
        account: &str,
        password: &str,
    ) -> AppResult<domain_auth::AuthUserAccount> {
        let user = self
            .repository
            .find_user_by_account(account)
            .await?
            .ok_or(AppError::Unauthorized)?;

        if user.status != 1 {
            return Err(AppError::Unauthorized);
        }

        if !Crypto::verify_password(password, &user.password_hash) {
            return Err(AppError::Unauthorized);
        }

        Ok(user)
    }

    /// Derive username/phone values from the signup account input.
    fn build_signup_identity(account: &str) -> (String, Option<String>) {
        let normalized = account.trim().to_string();
        if Self::looks_like_phone(&normalized) {
            (normalized.clone(), Some(normalized))
        } else {
            (normalized, None)
        }
    }

    /// Determine whether the raw account should be treated as a phone number.
    fn looks_like_phone(value: &str) -> bool {
        value.len() == 11 && value.chars().all(|ch| ch.is_ascii_digit())
    }

    /// Normalize free-form text into a slug-friendly seed.
    fn sanitize_slug_seed(value: &str) -> String {
        let mut slug = String::new();
        let mut previous_dash = false;

        for ch in value.trim().chars() {
            let next = if ch.is_ascii_alphanumeric() {
                Some(ch.to_ascii_lowercase())
            } else if matches!(ch, ' ' | '-' | '_' | '.') {
                Some('-')
            } else {
                None
            };

            if let Some(next) = next {
                if next == '-' {
                    if previous_dash || slug.is_empty() {
                        continue;
                    }
                    previous_dash = true;
                    slug.push(next);
                    continue;
                }

                previous_dash = false;
                slug.push(next);
            }
        }

        slug.trim_matches('-').to_string()
    }

    /// Generate a unique tenant slug for self-service signup.
    async fn generate_auto_tenant_slug(&self, seed: &str, account: &str) -> AppResult<String> {
        let sanitized_seed = Self::sanitize_slug_seed(seed);
        let sanitized_account = Self::sanitize_slug_seed(account);
        let base = if !sanitized_seed.is_empty() {
            sanitized_seed
        } else if !sanitized_account.is_empty() {
            sanitized_account
        } else {
            format!("tenant-{}", generate_sonyflake_id())
        };

        if self.repository.find_tenant_by_slug(&base).await?.is_none() {
            return Ok(base);
        }

        for index in 2..=100 {
            let candidate = format!("{base}-{index}");
            if self
                .repository
                .find_tenant_by_slug(candidate.as_str())
                .await?
                .is_none()
            {
                return Ok(candidate);
            }
        }

        Ok(format!("{base}-{}", generate_sonyflake_id()))
    }
}

#[async_trait]
impl<R> AuthService for AuthServiceImpl<R>
where
    R: AuthRepository,
{
    /// Validate credentials and captcha, then return selectable tenant memberships.
    async fn query_signin_tenants(
        &self,
        cmd: QuerySigninTenantsCmd,
    ) -> AppResult<Vec<domain_auth::SigninTenantOption>> {
        cmd.validate()?;
        self.validate_slider_captcha(&cmd.account, &cmd.code, false)
            .await?;

        let user = self.load_enabled_user(&cmd.account, &cmd.password).await?;
        self.repository.list_signin_tenants(user.id).await
    }

    /// Complete signin for the selected membership and issue the auth token pair.
    async fn account_signin(&self, cmd: AccountSigninCmd) -> AppResult<AuthToken> {
        cmd.validate()?;
        self.validate_slider_captcha(&cmd.account, &cmd.code, true)
            .await?;

        let user = self.load_enabled_user(&cmd.account, &cmd.password).await?;
        let options = self.repository.list_signin_tenants(user.id).await?;
        let selected = options
            .into_iter()
            .find(|option| {
                option.membership_id == cmd.membership_id && option.tenant_id == cmd.tenant_id
            })
            .ok_or(AppError::Unauthorized)?;

        if selected.status != 1 {
            return Err(AppError::ValidationError(
                "selected tenant is unavailable".to_string(),
            ));
        }

        let token = AuthHelper::generate_auth_token(
            &self.redis_pool,
            &self.prefix,
            self.expires_at,
            self.refresh_expires_at,
            AuthModel {
                uid: user.id,
                mobile: user.phone.unwrap_or_default(),
                nickname: user.nickname.unwrap_or_default(),
                username: user.username,
                tid: selected.tenant_id,
                tname: selected.tenant_name.clone(),
                ouid: selected.membership_id,
                ouname: selected
                    .display_name
                    .clone()
                    .unwrap_or_else(|| selected.tenant_name.clone()),
                rids: selected.role_ids.clone(),
                pmsids: Vec::new(),
            },
        )
        .await?;

        Ok(token.into())
    }

    /// Rotate the current access token and refresh token pair.
    async fn refresh_token(&self, cmd: RefreshAuthCmd) -> AppResult<AuthToken> {
        cmd.validate()?;
        let token = AuthHelper::refresh_auth(
            &self.redis_pool,
            &self.prefix,
            self.expires_at,
            self.refresh_expires_at,
            &cmd.access_token,
            &cmd.refresh_token,
        )
        .await?;

        Ok(token.into())
    }

    /// Create the full self-service signup aggregate and return the created identity.
    async fn account_signup(&self, cmd: AccountSignupCmd) -> AppResult<AccountSignupResult> {
        cmd.validate()?;
        self.validate_slider_captcha(&cmd.account, &cmd.code, true)
            .await?;

        let normalized_account = cmd.account.trim().to_string();
        if self
            .repository
            .find_user_by_account(&normalized_account)
            .await?
            .is_some()
        {
            return Err(AppError::conflict_here(
                "account already exists".to_string(),
            ));
        }

        // Use the provided tenant name when available, otherwise fall back to the account.
        let tenant_name = cmd
            .tenant_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| normalized_account.clone());

        // Prefer a deterministic slug from the tenant name, and fall back to auto generation.
        let tenant_slug = if cmd
            .tenant_name
            .as_ref()
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false)
        {
            let slug = {
                let sanitized = Self::sanitize_slug_seed(&tenant_name);
                if sanitized.is_empty() {
                    self.generate_auto_tenant_slug(&tenant_name, &normalized_account)
                        .await?
                } else {
                    sanitized
                }
            };

            if self
                .repository
                .find_tenant_by_name_or_slug(&tenant_name, &slug)
                .await?
                .is_some()
            {
                return Err(AppError::conflict_here("tenant already exists".to_string()));
            }

            slug
        } else {
            self.generate_auto_tenant_slug(&tenant_name, &normalized_account)
                .await?
        };

        // Build the records that will be stored transactionally by the repository.
        let password_hash = Crypto::hash_password(&cmd.password)
            .map_err(|err| AppError::data_here(format!("failed to hash signup password: {err}")))?;
        let nickname = cmd
            .nickname
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let display_name = nickname
            .clone()
            .or_else(|| Some(normalized_account.clone()));

        let (username, phone) = Self::build_signup_identity(&normalized_account);

        let user = User::new(CreateUserCmd {
            id: generate_sonyflake_id() as i64,
            username: username.clone(),
            email: None,
            phone,
            password_hash,
            nickname: nickname.clone(),
            avatar_url: None,
            gender: 0,
            status: 1,
            bio: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let tenant = Tenant::new(CreateTenantCmd {
            id: generate_sonyflake_id() as i64,
            parent_id: None,
            slug: tenant_slug.clone(),
            name: tenant_name.clone(),
            description: None,
            owner_user_id: Some(user.id),
            status: 1,
            plan_code: None,
            expired_at: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let role = Role::new(CreateRoleCmd {
            id: generate_sonyflake_id() as i64,
            tenant_id: Some(tenant.id),
            parent_id: None,
            code: DEFAULT_GUEST_ROLE_CODE.to_string(),
            name: DEFAULT_GUEST_ROLE_NAME.to_string(),
            description: Some("Default guest role for self-service signup tenant".to_string()),
            status: 1,
            is_builtin: true,
            sort: 0,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let user_tenant = UserTenant::new(CreateUserTenantCmd {
            id: generate_sonyflake_id() as i64,
            user_id: user.id,
            tenant_id: tenant.id,
            display_name,
            employee_no: None,
            job_title: None,
            status: 1,
            is_default: true,
            is_tenant_admin: false,
            joined_at: Utc::now(),
            invited_by: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let user_tenant_role = UserTenantRole::new(CreateUserTenantRoleCmd {
            id: generate_sonyflake_id() as i64,
            user_tenant_id: user_tenant.id,
            role_id: role.id,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository
            .create_account_signup_bundle(&AccountSignupBundle {
                user,
                tenant,
                role,
                user_tenant,
                user_tenant_role,
            })
            .await?;

        Ok(AccountSignupResult {
            account: normalized_account,
            username,
            tenant_name,
            tenant_slug,
        })
    }

    /// Delete the current user's cached tokens from the auth store.
    async fn logout(&self, uid: i64) -> AppResult<()> {
        AuthHelper::delete_token(&self.redis_pool, &self.prefix, uid).await
    }
}
