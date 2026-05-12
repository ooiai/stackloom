use std::sync::Arc;

use chrono::Utc;
use common::core::{
    biz_error::{
        AUTH_ACCOUNT_DISABLED, AUTH_ACCOUNT_EXISTS, AUTH_ACCOUNT_NOT_FOUND,
        AUTH_CREDENTIAL_INVALID, AUTH_RECOVERY_CODE_INVALID, AUTH_SIGNUP_CODE_INVALID,
        AUTH_TENANT_EXISTS,
    },
    constants::{
        CACHE_INVITE_CODE_LOOKUP, CACHE_PASSWORD_RESET_EMAIL_CODE, CACHE_PASSWORD_RESET_PHONE_CODE,
        CACHE_PASSWORD_RESET_SEND_COOLDOWN, CACHE_SIGNUP_EMAIL_CODE, CACHE_SIGNUP_PHONE_CODE,
        CACHE_SIGNUP_SEND_COOLDOWN, SIGNUP_ADMIN_CODE, get_email_regex, get_mobile_regex,
    },
};
use domain_auth::{
    AccountSigninCmd, AccountSignupBundle, AccountSignupCmd, AccountSignupResult, AuthRepository,
    AuthService, AuthToken, AuthUserAccount, ChangePasswordCmd, InviteSignupBundle,
    InviteSignupCmd, QuerySigninTenantsCmd, RecoveryChannel, RefreshAuthCmd, ResetPasswordCmd,
    SendPasswordResetCodeCmd, SendSignupCodeCmd, SigninTenantOption, SwitchTenantAuthCmd,
};
use domain_base::{
    CreateTenantCmd, CreateUserCmd, CreateUserTenantCmd, CreateUserTenantRoleCmd, Role,
    RoleRepository, Tenant, User, UserTenant, UserTenantRole,
};
use neocrates::{
    async_trait::async_trait,
    auth::auth_helper::AuthHelper,
    captcha::CaptchaService,
    crypto::core::Crypto,
    email::email_service::{EmailConfig, EmailService},
    helper::core::snowflake::generate_sonyflake_id,
    middlewares::models::AuthModel,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    sms::sms_service::{SmsConfig, SmsService},
    sqlxhelper::pool::SqlxPool,
    tracing,
};

use super::repo::SqlxAuthRepository;
use infra_base::SqlxRoleRepository;

/// Infra implementation of the auth domain service.
///
/// It coordinates captcha validation, credential checks, token issuing,
/// tenant conflict detection, and transactional signup persistence.
#[derive(Clone)]
pub struct AuthServiceImpl<R, Rr>
where
    R: AuthRepository,
    Rr: RoleRepository,
{
    repository: Arc<R>,
    role_repository: Arc<Rr>,
    redis_pool: Arc<RedisPool>,
    sms_config: Arc<SmsConfig>,
    email_config: Arc<EmailConfig>,
    prefix: String,
    expires_at: u64,
    refresh_expires_at: u64,
}

impl AuthServiceImpl<SqlxAuthRepository, SqlxRoleRepository> {
    /// Build the default auth service backed by the SQL repositories.
    pub fn new(
        pool: Arc<SqlxPool>,
        redis_pool: Arc<RedisPool>,
        sms_config: Arc<SmsConfig>,
        email_config: Arc<EmailConfig>,
        prefix: String,
        expires_at: u64,
        refresh_expires_at: u64,
    ) -> Self {
        Self {
            repository: Arc::new(SqlxAuthRepository::new(pool.clone())),
            role_repository: Arc::new(SqlxRoleRepository::new(pool)),
            redis_pool,
            sms_config,
            email_config,
            prefix,
            expires_at,
            refresh_expires_at,
        }
    }
}

impl<R, Rr> AuthServiceImpl<R, Rr>
where
    R: AuthRepository,
    Rr: RoleRepository,
{
    /// Build the service with caller-provided repositories, mainly for tests or composition.
    pub fn with_repository(
        repository: Arc<R>,
        role_repository: Arc<Rr>,
        redis_pool: Arc<RedisPool>,
        sms_config: Arc<SmsConfig>,
        email_config: Arc<EmailConfig>,
        prefix: String,
        expires_at: u64,
        refresh_expires_at: u64,
    ) -> Self {
        Self {
            repository,
            role_repository,
            redis_pool,
            sms_config,
            email_config,
            prefix,
            expires_at,
            refresh_expires_at,
        }
    }

    fn password_reset_code_prefix(&self, channel: RecoveryChannel) -> String {
        match channel {
            RecoveryChannel::Phone => format!("{}{}", self.prefix, CACHE_PASSWORD_RESET_PHONE_CODE),
            RecoveryChannel::Email => format!("{}{}", self.prefix, CACHE_PASSWORD_RESET_EMAIL_CODE),
        }
    }

    fn signup_code_prefix(&self, channel: RecoveryChannel) -> String {
        match channel {
            RecoveryChannel::Phone => format!("{}{}", self.prefix, CACHE_SIGNUP_PHONE_CODE),
            RecoveryChannel::Email => format!("{}{}", self.prefix, CACHE_SIGNUP_EMAIL_CODE),
        }
    }

    fn password_reset_cooldown_key(&self, channel: RecoveryChannel, account: &str) -> String {
        let channel_name = match channel {
            RecoveryChannel::Phone => "phone",
            RecoveryChannel::Email => "email",
        };
        format!(
            "{}{}:{}:{}",
            self.prefix, CACHE_PASSWORD_RESET_SEND_COOLDOWN, channel_name, account
        )
    }

    fn signup_cooldown_key(&self, channel: RecoveryChannel, contact: &str) -> String {
        let channel_name = match channel {
            RecoveryChannel::Phone => "phone",
            RecoveryChannel::Email => "email",
        };
        format!(
            "{}{}:{}:{}",
            self.prefix, CACHE_SIGNUP_SEND_COOLDOWN, channel_name, contact
        )
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
    async fn load_enabled_user(&self, account: &str, password: &str) -> AppResult<AuthUserAccount> {
        let user = match self.repository.find_user_by_account(account).await? {
            Some(u) => u,
            None => {
                tracing::warn!(account = %account, "signin failed: account not found");
                return Err(AppError::DataError(
                    AUTH_ACCOUNT_NOT_FOUND,
                    "account not found".to_string(),
                ));
            }
        };

        if user.status != 1 {
            tracing::warn!(
                account = %account,
                user_id = %user.id,
                status = %user.status,
                "signin failed: account status not active"
            );
            return Err(AppError::DataError(
                AUTH_ACCOUNT_DISABLED,
                "account is disabled".to_string(),
            ));
        }

        if !Crypto::verify_password(password, &user.password_hash) {
            tracing::warn!(
                account = %account,
                user_id = %user.id,
                "signin failed: password mismatch"
            );
            return Err(AppError::DataError(
                AUTH_CREDENTIAL_INVALID,
                "invalid credentials".to_string(),
            ));
        }

        Ok(user)
    }

    async fn load_enabled_user_by_id(&self, user_id: i64) -> AppResult<AuthUserAccount> {
        let user = self
            .repository
            .find_user_by_id(user_id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(AUTH_ACCOUNT_NOT_FOUND, "account not found".to_string())
            })?;

        if user.status != 1 {
            tracing::warn!(
                user_id = %user.id,
                status = %user.status,
                "switch tenant failed: account status not active"
            );
            return Err(AppError::DataError(
                AUTH_ACCOUNT_DISABLED,
                "account is disabled".to_string(),
            ));
        }

        Ok(user)
    }

    fn select_active_membership(
        &self,
        options: Vec<SigninTenantOption>,
        membership_id: i64,
        tenant_id: i64,
    ) -> AppResult<SigninTenantOption> {
        let selected = options
            .into_iter()
            .find(|option| option.membership_id == membership_id && option.tenant_id == tenant_id)
            .ok_or(AppError::Unauthorized)?;

        if selected.status != 1 {
            return Err(AppError::ValidationError(
                "selected tenant is unavailable".to_string(),
            ));
        }

        Ok(selected)
    }

    async fn issue_auth_token(
        &self,
        user: AuthUserAccount,
        selected: SigninTenantOption,
    ) -> AppResult<AuthToken> {
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

        if let Err(err) = self
            .repository
            .record_login_event(user.id, selected.tenant_id)
            .await
        {
            tracing::warn!(user_id = user.id, tenant_id = selected.tenant_id, error = %err, "failed to record login event");
        }

        Ok(token.into())
    }

    fn normalize_signup_contact(channel: RecoveryChannel, contact: &str) -> AppResult<String> {
        let normalized = match channel {
            RecoveryChannel::Phone => contact.trim().to_string(),
            RecoveryChannel::Email => contact.trim().to_ascii_lowercase(),
        };

        let is_valid = match channel {
            RecoveryChannel::Phone => get_mobile_regex().is_match(&normalized),
            RecoveryChannel::Email => get_email_regex().is_match(&normalized),
        };

        if !is_valid {
            let field = match channel {
                RecoveryChannel::Phone => "phone",
                RecoveryChannel::Email => "email",
            };
            return Err(AppError::ValidationError(format!("invalid signup {field}")));
        }

        Ok(normalized)
    }

    fn split_signup_identity(
        channel: RecoveryChannel,
        contact: &str,
    ) -> (Option<String>, Option<String>) {
        match channel {
            RecoveryChannel::Phone => (None, Some(contact.to_string())),
            RecoveryChannel::Email => (Some(contact.to_string()), None),
        }
    }

    fn encode_base36(mut value: u64) -> String {
        const ALPHABET: &[u8; 36] = b"0123456789abcdefghijklmnopqrstuvwxyz";
        if value == 0 {
            return "0".to_string();
        }

        let mut chars = Vec::new();
        while value > 0 {
            let remainder = (value % 36) as usize;
            chars.push(ALPHABET[remainder] as char);
            value /= 36;
        }
        chars.iter().rev().collect()
    }

    async fn generate_unique_username(&self) -> AppResult<String> {
        for _ in 0..20 {
            let candidate = format!("u{}", Self::encode_base36(generate_sonyflake_id() as u64));
            if self
                .repository
                .find_user_by_username(candidate.as_str())
                .await?
                .is_none()
            {
                return Ok(candidate);
            }
        }

        Err(AppError::data_here(
            "failed to generate unique signup username".to_string(),
        ))
    }

    async fn validate_signup_captcha(
        &self,
        channel: RecoveryChannel,
        contact: &str,
        captcha: &str,
    ) -> AppResult<()> {
        let code_prefix = self.signup_code_prefix(channel);
        match channel {
            RecoveryChannel::Phone => SmsService::valid_auth_captcha(
                &self.redis_pool,
                contact,
                captcha,
                code_prefix.as_str(),
                true,
            )
            .await
            .map_err(|err| AppError::DataError(AUTH_SIGNUP_CODE_INVALID, err.to_string())),
            RecoveryChannel::Email => EmailService::valid_auth_captcha(
                &self.redis_pool,
                contact,
                captcha,
                code_prefix.as_str(),
                true,
            )
            .await
            .map_err(|err| AppError::DataError(AUTH_SIGNUP_CODE_INVALID, err.to_string())),
        }
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

    /// Load the system-level signup role template from the roles table.
    async fn load_signup_role_template(&self) -> AppResult<Role> {
        self.role_repository
            .find_system_role_by_code(SIGNUP_ADMIN_CODE)
            .await?
            .ok_or_else(|| {
                AppError::not_found_here(format!(
                    "signup role template not found: {SIGNUP_ADMIN_CODE}"
                ))
            })
    }

    /// Resolve an invite code to the existing tenant summary needed for
    /// invite-aware signup.
    async fn resolve_invited_tenant(
        &self,
        invite_code: &str,
    ) -> AppResult<domain_auth::AuthTenantSummary> {
        let lookup_key = format!("{}{}{}", self.prefix, CACHE_INVITE_CODE_LOOKUP, invite_code);
        let tenant_id_str = self
            .redis_pool
            .get::<_, String>(&lookup_key)
            .await
            .ok()
            .flatten()
            .ok_or_else(|| {
                AppError::DataError(
                    common::core::biz_error::INVITE_CODE_INVALID,
                    format!("invite code not found or expired: {invite_code}"),
                )
            })?;

        let tenant_id: i64 = tenant_id_str.parse().map_err(|_| {
            AppError::DataError(
                common::core::biz_error::INVITE_CODE_INVALID,
                format!("invalid tenant_id in invite lookup: {tenant_id_str}"),
            )
        })?;

        self.repository
            .find_tenant_by_id(tenant_id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    common::core::biz_error::INVITE_CODE_INVALID,
                    format!("tenant not found for invite code: {invite_code}"),
                )
            })
    }
}

#[async_trait]
impl<R, Rr> AuthService for AuthServiceImpl<R, Rr>
where
    R: AuthRepository,
    Rr: RoleRepository,
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
        let selected = self.select_active_membership(options, cmd.membership_id, cmd.tenant_id)?;

        self.issue_auth_token(user, selected).await
    }

    async fn switch_tenant_auth(&self, cmd: SwitchTenantAuthCmd) -> AppResult<AuthToken> {
        cmd.validate()?;

        let user = self.load_enabled_user_by_id(cmd.user_id).await?;
        let options = self.repository.list_signin_tenants(user.id).await?;
        let selected = self.select_active_membership(options, cmd.membership_id, cmd.tenant_id)?;

        self.issue_auth_token(user, selected).await
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
        let normalized_contact = Self::normalize_signup_contact(cmd.channel, &cmd.contact)?;
        if self
            .repository
            .find_user_by_account(&normalized_contact)
            .await?
            .is_some()
        {
            return Err(AppError::DataError(
                AUTH_ACCOUNT_EXISTS,
                "account already exists".to_string(),
            ));
        }
        self.validate_signup_captcha(cmd.channel, &normalized_contact, &cmd.captcha)
            .await?;

        let username = self.generate_unique_username().await?;
        let nickname = cmd
            .nickname
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let tenant_name_seed = nickname.clone().unwrap_or_else(|| username.clone());

        // Use the provided tenant name when available, otherwise fall back to the generated identity.
        let tenant_name = cmd
            .tenant_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| tenant_name_seed.clone());

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
                    self.generate_auto_tenant_slug(&tenant_name, &username)
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
                return Err(AppError::DataError(
                    AUTH_TENANT_EXISTS,
                    "tenant already exists".to_string(),
                ));
            }

            slug
        } else {
            self.generate_auto_tenant_slug(&tenant_name, &username)
                .await?
        };

        // Build the records that will be stored transactionally by the repository.
        let password_hash = Crypto::hash_password(&cmd.password)
            .map_err(|err| AppError::data_here(format!("failed to hash signup password: {err}")))?;
        let display_name = nickname.clone().or_else(|| Some(username.clone()));
        let (email, phone) = Self::split_signup_identity(cmd.channel, &normalized_contact);
        let role_template = self.load_signup_role_template().await?;

        let user = User::new(CreateUserCmd {
            id: generate_sonyflake_id() as i64,
            username: username.clone(),
            email,
            phone,
            password_hash,
            nickname: nickname.clone(),
            avatar_url: None,
            gender: 0,
            // Signup codes already verify the contact channel, so the tenant creator can sign in immediately.
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
            logo_url: None,
            expired_at: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let user_tenant = UserTenant::new(CreateUserTenantCmd {
            id: generate_sonyflake_id() as i64,
            user_id: user.id,
            tenant_id: tenant.id,
            display_name,
            employee_no: None,
            job_title: None,
            // Self-service signups start as pending (status=2) and require admin approval.
            status: 2,
            is_default: true,
            is_tenant_admin: true,
            joined_at: Utc::now(),
            invited_by: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let user_tenant_role = UserTenantRole::new(CreateUserTenantRoleCmd {
            id: generate_sonyflake_id() as i64,
            user_tenant_id: user_tenant.id,
            role_id: role_template.id,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
        let user_id = user.id;
        let membership_id = user_tenant.id;
        let tenant_id = tenant.id;

        self.repository
            .create_account_signup_bundle(&AccountSignupBundle {
                user,
                tenant,
                user_tenant,
                user_tenant_role,
            })
            .await?;

        Ok(AccountSignupResult {
            user_id,
            membership_id,
            tenant_id,
            account: normalized_contact,
            username,
            tenant_name,
            tenant_slug,
        })
    }

    async fn send_signup_code(&self, cmd: SendSignupCodeCmd) -> AppResult<()> {
        cmd.validate()?;
        let normalized_contact = Self::normalize_signup_contact(cmd.channel, &cmd.contact)?;
        self.validate_slider_captcha(&normalized_contact, &cmd.code, true)
            .await?;

        let cooldown_key = self.signup_cooldown_key(cmd.channel, &normalized_contact);
        if let Ok(true) = self.redis_pool.exists(&cooldown_key).await {
            return Ok(());
        }

        let code_prefix = self.signup_code_prefix(cmd.channel);
        match cmd.channel {
            RecoveryChannel::Phone => {
                SmsService::send_captcha(
                    &self.sms_config,
                    &self.redis_pool,
                    &normalized_contact,
                    code_prefix.as_str(),
                    get_mobile_regex(),
                )
                .await?;
            }
            RecoveryChannel::Email => {
                EmailService::send_captcha(
                    &self.email_config,
                    &self.redis_pool,
                    &normalized_contact,
                    code_prefix.as_str(),
                    get_email_regex(),
                )
                .await?;
            }
        }

        if let Err(err) = self.redis_pool.setex(&cooldown_key, "1", 60).await {
            tracing::warn!(error = %err, "failed to set signup cooldown");
        }

        Ok(())
    }

    /// Create a new account directly inside the tenant referenced by the invite.
    async fn invite_signup(&self, cmd: InviteSignupCmd) -> AppResult<AccountSignupResult> {
        cmd.validate()?;
        let normalized_contact = Self::normalize_signup_contact(cmd.channel, &cmd.contact)?;
        if self
            .repository
            .find_user_by_account(&normalized_contact)
            .await?
            .is_some()
        {
            return Err(AppError::DataError(
                AUTH_ACCOUNT_EXISTS,
                "account already exists".to_string(),
            ));
        }
        self.validate_signup_captcha(cmd.channel, &normalized_contact, &cmd.captcha)
            .await?;

        let tenant = self.resolve_invited_tenant(cmd.invite_code.trim()).await?;
        let password_hash = Crypto::hash_password(&cmd.password)
            .map_err(|err| AppError::data_here(format!("failed to hash signup password: {err}")))?;
        let username = self.generate_unique_username().await?;
        let nickname = cmd
            .nickname
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let display_name = nickname.clone().or_else(|| Some(username.clone()));

        let (email, phone) = Self::split_signup_identity(cmd.channel, &normalized_contact);
        let user = User::new(CreateUserCmd {
            id: generate_sonyflake_id() as i64,
            username: username.clone(),
            email,
            phone,
            password_hash,
            nickname: nickname.clone(),
            avatar_url: None,
            gender: 0,
            // Invite signup must create an account that can sign in immediately.
            status: 1,
            bio: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let user_tenant = UserTenant::new(CreateUserTenantCmd {
            id: generate_sonyflake_id() as i64,
            user_id: user.id,
            tenant_id: tenant.id,
            display_name,
            employee_no: None,
            job_title: None,
            status: 2,
            is_default: true,
            is_tenant_admin: false,
            joined_at: Utc::now(),
            invited_by: None,
        })
        .map_err(|err| AppError::ValidationError(err.to_string()))?;
        let user_id = user.id;
        let membership_id = user_tenant.id;
        let tenant_id = tenant.id;
        let tenant_name = tenant.name.clone();
        let tenant_slug = tenant.slug.clone();

        self.repository
            .create_invite_signup_bundle(&InviteSignupBundle { user, user_tenant })
            .await?;

        Ok(AccountSignupResult {
            user_id,
            membership_id,
            tenant_id,
            account: normalized_contact,
            username,
            tenant_name,
            tenant_slug,
        })
    }

    async fn send_password_reset_code(&self, cmd: SendPasswordResetCodeCmd) -> AppResult<()> {
        cmd.validate()?;
        self.validate_slider_captcha(&cmd.account, &cmd.code, true)
            .await?;

        let normalized_account = cmd.account.trim().to_string();
        let cooldown_key = self.password_reset_cooldown_key(cmd.channel, &normalized_account);
        if let Ok(true) = self.redis_pool.exists(&cooldown_key).await {
            return Ok(());
        }

        let user = self
            .repository
            .find_user_by_channel_account(cmd.channel, &normalized_account)
            .await?;
        let Some(user) = user else {
            if let Err(err) = self.redis_pool.setex(&cooldown_key, "1", 60).await {
                tracing::warn!(error = %err, "failed to set password reset cooldown");
            }
            return Ok(());
        };

        let code_prefix = self.password_reset_code_prefix(cmd.channel);
        match cmd.channel {
            RecoveryChannel::Phone => {
                if let Some(phone) = user.phone.as_ref() {
                    SmsService::send_captcha(
                        &self.sms_config,
                        &self.redis_pool,
                        phone,
                        code_prefix.as_str(),
                        get_mobile_regex(),
                    )
                    .await?;
                } else {
                    return Ok(());
                }
            }
            RecoveryChannel::Email => {
                if let Some(email) = user.email.as_ref() {
                    EmailService::send_captcha(
                        &self.email_config,
                        &self.redis_pool,
                        email,
                        code_prefix.as_str(),
                        get_email_regex(),
                    )
                    .await?;
                } else {
                    return Ok(());
                }
            }
        }

        if let Err(err) = self.redis_pool.setex(&cooldown_key, "1", 60).await {
            tracing::warn!(error = %err, "failed to set password reset cooldown");
        }

        Ok(())
    }

    async fn reset_password(&self, cmd: ResetPasswordCmd) -> AppResult<()> {
        cmd.validate()?;
        let normalized_account = cmd.account.trim().to_string();
        let user = self
            .repository
            .find_user_by_channel_account(cmd.channel, &normalized_account)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    AUTH_RECOVERY_CODE_INVALID,
                    "password reset account not found".to_string(),
                )
            })?;

        let code_prefix = self.password_reset_code_prefix(cmd.channel);
        match cmd.channel {
            RecoveryChannel::Phone => {
                let phone = user.phone.as_ref().ok_or_else(|| {
                    AppError::DataError(
                        AUTH_RECOVERY_CODE_INVALID,
                        "password reset phone not bound".to_string(),
                    )
                })?;
                SmsService::valid_auth_captcha(
                    &self.redis_pool,
                    phone,
                    &cmd.captcha,
                    code_prefix.as_str(),
                    true,
                )
                .await
                .map_err(|err| AppError::DataError(AUTH_RECOVERY_CODE_INVALID, err.to_string()))?;
            }
            RecoveryChannel::Email => {
                let email = user.email.as_ref().ok_or_else(|| {
                    AppError::DataError(
                        AUTH_RECOVERY_CODE_INVALID,
                        "password reset email not bound".to_string(),
                    )
                })?;
                EmailService::valid_auth_captcha(
                    &self.redis_pool,
                    email,
                    &cmd.captcha,
                    code_prefix.as_str(),
                    true,
                )
                .await
                .map_err(|err| AppError::DataError(AUTH_RECOVERY_CODE_INVALID, err.to_string()))?;
            }
        }

        let password_hash = Crypto::hash_password(&cmd.new_password)
            .map_err(|err| AppError::data_here(format!("failed to hash reset password: {err}")))?;

        AuthHelper::delete_token(&self.redis_pool, &self.prefix, user.id).await?;
        self.repository
            .update_user_password_hash(user.id, &password_hash)
            .await?;

        Ok(())
    }

    async fn change_password(&self, uid: i64, cmd: ChangePasswordCmd) -> AppResult<()> {
        cmd.validate()?;
        let user = match self.repository.find_user_by_id(uid).await? {
            Some(user) => user,
            None => {
                tracing::warn!(user_id = %uid, "change password failed: account not found");
                return Err(AppError::DataError(
                    AUTH_ACCOUNT_NOT_FOUND,
                    "account not found".to_string(),
                ));
            }
        };

        if user.status != 1 {
            tracing::warn!(
                user_id = %uid,
                status = %user.status,
                "change password failed: account status not active"
            );
            return Err(AppError::DataError(
                AUTH_ACCOUNT_DISABLED,
                "account is disabled".to_string(),
            ));
        }

        if !Crypto::verify_password(&cmd.current_password, &user.password_hash) {
            tracing::warn!(user_id = %uid, "change password failed: password mismatch");
            return Err(AppError::DataError(
                AUTH_CREDENTIAL_INVALID,
                "invalid credentials".to_string(),
            ));
        }

        let password_hash = Crypto::hash_password(&cmd.new_password)
            .map_err(|err| AppError::data_here(format!("failed to hash change password: {err}")))?;

        AuthHelper::delete_token(&self.redis_pool, &self.prefix, user.id).await?;
        self.repository
            .update_user_password_hash(user.id, &password_hash)
            .await?;

        Ok(())
    }

    /// Delete the current user's cached tokens from the auth store.
    async fn logout(&self, uid: i64) -> AppResult<()> {
        AuthHelper::delete_token(&self.redis_pool, &self.prefix, uid).await
    }
}
