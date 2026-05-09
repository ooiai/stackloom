use std::sync::Arc;

use common::core::{
    biz_error::{USER_EMAIL_EXISTS, USER_PHONE_EXISTS},
    biz_error::MEMBER_NOT_FOUND,
    constants::{CACHE_SHARED_CTX_TID_PREFIX, CACHE_SHARED_CTX_UID_SEGMENT},
};
use domain_base::{
    RoleCodeService, SharedContextService, SharedHeaderContext, SharedHeaderUser, TenantService,
    UpdateProfileCmd, UserProfileView, UserService, UserTenantRoleService, UserTenantService,
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    serde::{Deserialize, Serialize},
    sqlxhelper::pool::SqlxPool,
    tracing,
};
use neocrates::rediscache::RedisPool;
use sqlx::Error as SqlxError;

const SHARED_CONTEXT_CACHE_TTL_SECONDS: u64 = 120;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct HeaderContextCachePayload {
    user_id: i64,
    username: String,
    email: Option<String>,
    phone: Option<String>,
    nickname: Option<String>,
    avatar_url: Option<String>,
    display_name: Option<String>,
    employee_no: Option<String>,
    job_title: Option<String>,
    tenant_name: String,
    tenant_id: i64,
    menu_codes: Vec<String>,
    perm_codes: Vec<String>,
    role_ids: Vec<i64>,
}

impl HeaderContextCachePayload {
    fn into_domain(self) -> SharedHeaderContext {
        SharedHeaderContext {
            user: SharedHeaderUser {
                id: self.user_id,
                username: self.username,
                email: self.email,
                phone: self.phone,
                nickname: self.nickname,
                avatar_url: self.avatar_url,
                display_name: self.display_name,
                employee_no: self.employee_no,
                job_title: self.job_title,
                tenant_name: self.tenant_name,
                tenant_id: self.tenant_id,
            },
            menu_codes: self.menu_codes,
            perm_codes: self.perm_codes,
            role_ids: self.role_ids,
        }
    }
}

impl From<SharedHeaderContext> for HeaderContextCachePayload {
    fn from(value: SharedHeaderContext) -> Self {
        Self {
            user_id: value.user.id,
            username: value.user.username,
            email: value.user.email,
            phone: value.user.phone,
            nickname: value.user.nickname,
            avatar_url: value.user.avatar_url,
            display_name: value.user.display_name,
            employee_no: value.user.employee_no,
            job_title: value.user.job_title,
            tenant_name: value.user.tenant_name,
            tenant_id: value.user.tenant_id,
            menu_codes: value.menu_codes,
            perm_codes: value.perm_codes,
            role_ids: value.role_ids,
        }
    }
}

#[derive(Clone)]
pub struct SharedContextServiceImpl {
    pool: Arc<SqlxPool>,
    user_service: Arc<dyn UserService>,
    tenant_service: Arc<dyn TenantService>,
    user_tenant_service: Arc<dyn UserTenantService>,
    user_tenant_role_service: Arc<dyn UserTenantRoleService>,
    role_code_service: Arc<dyn RoleCodeService>,
    redis_pool: Arc<RedisPool>,
    cache_prefix: String,
}

impl SharedContextServiceImpl {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        pool: Arc<SqlxPool>,
        user_service: Arc<dyn UserService>,
        tenant_service: Arc<dyn TenantService>,
        user_tenant_service: Arc<dyn UserTenantService>,
        user_tenant_role_service: Arc<dyn UserTenantRoleService>,
        role_code_service: Arc<dyn RoleCodeService>,
        redis_pool: Arc<RedisPool>,
        cache_prefix: String,
    ) -> Self {
        Self {
            pool,
            user_service,
            tenant_service,
            user_tenant_service,
            user_tenant_role_service,
            role_code_service,
            redis_pool,
            cache_prefix,
        }
    }

    fn map_user_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err
            && db_err.code().as_deref() == Some("23505")
        {
            return match db_err.constraint() {
                Some("users_email_key") => {
                    AppError::DataError(USER_EMAIL_EXISTS, "email already exists".to_string())
                }
                Some("users_phone_key") => {
                    AppError::DataError(USER_PHONE_EXISTS, "phone already exists".to_string())
                }
                _ => AppError::data_here(err.to_string()),
            };
        }

        AppError::data_here(err.to_string())
    }

    fn member_not_found_error(user_id: i64, tenant_id: i64) -> AppError {
        AppError::DataError(
            MEMBER_NOT_FOUND,
            format!(
                "membership not found for user_id={} tenant_id={}",
                user_id, tenant_id
            ),
        )
    }

    fn user_tenant_cache_key(&self, user_id: i64, tenant_id: i64) -> String {
        format!(
            "{}{}{}{}{}",
            self.cache_prefix,
            CACHE_SHARED_CTX_TID_PREFIX,
            tenant_id,
            CACHE_SHARED_CTX_UID_SEGMENT,
            user_id
        )
    }

    fn tenant_cache_prefix(&self, tenant_id: i64) -> String {
        format!(
            "{}{}{}{}",
            self.cache_prefix, CACHE_SHARED_CTX_TID_PREFIX, tenant_id, CACHE_SHARED_CTX_UID_SEGMENT
        )
    }

    async fn build_header_context(&self, user_id: i64, tenant_id: i64) -> AppResult<SharedHeaderContext> {
        let user = self.user_service.get(user_id).await?;
        let tenant = self.tenant_service.get(tenant_id).await?;
        let membership = self
            .user_tenant_service
            .find_by_user_and_tenant(user_id, tenant_id)
            .await?
            .ok_or_else(|| Self::member_not_found_error(user_id, tenant_id))?;
        let role_ids = self
            .user_tenant_role_service
            .list_by_membership(membership.id)
            .await?
            .into_iter()
            .map(|binding| binding.role_id)
            .collect::<Vec<_>>();
        let menu_codes = self.role_code_service.aggregate_menu_codes(&role_ids).await?;
        let perm_codes = self.role_code_service.aggregate_perm_codes(&role_ids).await?;

        Ok(SharedHeaderContext {
            user: SharedHeaderUser {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                nickname: user.nickname,
                avatar_url: user.avatar_url,
                display_name: membership.display_name,
                employee_no: membership.employee_no,
                job_title: membership.job_title,
                tenant_name: tenant.name,
                tenant_id,
            },
            menu_codes,
            perm_codes,
            role_ids,
        })
    }
}

#[async_trait]
impl SharedContextService for SharedContextServiceImpl {
    async fn get_header_context(&self, user_id: i64, tenant_id: i64) -> AppResult<SharedHeaderContext> {
        let cache_key = self.user_tenant_cache_key(user_id, tenant_id);

        if let Ok(Some(raw)) = self.redis_pool.get::<_, String>(&cache_key).await {
            match neocrates::serde_json::from_str::<HeaderContextCachePayload>(&raw) {
                Ok(payload) => return Ok(payload.into_domain()),
                Err(err) => {
                    tracing::warn!(
                        uid = %user_id,
                        tid = %tenant_id,
                        error = %err,
                        "shared_context: failed to parse cache payload"
                    );
                }
            }
        }

        let context = self.build_header_context(user_id, tenant_id).await?;
        if let Ok(raw) = neocrates::serde_json::to_string(&HeaderContextCachePayload::from(context.clone())) {
            if let Err(err) = self
                .redis_pool
                .setex(&cache_key, &raw, SHARED_CONTEXT_CACHE_TTL_SECONDS)
                .await
            {
                tracing::warn!(
                    uid = %user_id,
                    tid = %tenant_id,
                    error = %err,
                    "shared_context: failed to write cache"
                );
            }
        }

        Ok(context)
    }

    async fn get_profile(&self, user_id: i64, tenant_id: i64) -> AppResult<UserProfileView> {
        let user = self.user_service.get(user_id).await?;
        let tenant = self.tenant_service.get(tenant_id).await?;
        let membership = self
            .user_tenant_service
            .find_by_user_and_tenant(user_id, tenant_id)
            .await?
            .ok_or_else(|| Self::member_not_found_error(user_id, tenant_id))?;

        Ok(UserProfileView {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            display_name: membership.display_name,
            employee_no: membership.employee_no,
            job_title: membership.job_title,
            tenant_id,
            tenant_name: tenant.name,
        })
    }

    async fn update_profile(
        &self,
        user_id: i64,
        tenant_id: i64,
        cmd: UpdateProfileCmd,
    ) -> AppResult<UserProfileView> {
        cmd.user.validate()?;
        cmd.membership.validate()?;

        let need_update_user = cmd.user.email.is_some()
            || cmd.user.phone.is_some()
            || cmd.user.nickname.is_some()
            || cmd.user.avatar_url.is_some();
        let need_update_member = cmd.membership.display_name.is_some()
            || cmd.membership.employee_no.is_some()
            || cmd.membership.job_title.is_some();

        if !need_update_user && !need_update_member {
            return self.get_profile(user_id, tenant_id).await;
        }

        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(|err| AppError::data_here(format!("failed to begin update profile transaction: {err}")))?;

        if need_update_user {
            let result = sqlx::query(
                r#"
                UPDATE users
                SET
                    email = CASE WHEN $2 THEN $3 ELSE email END,
                    phone = CASE WHEN $4 THEN $5 ELSE phone END,
                    nickname = CASE WHEN $6 THEN $7 ELSE nickname END,
                    avatar_url = CASE WHEN $8 THEN $9 ELSE avatar_url END,
                    updated_at = $10
                WHERE id = $1
                  AND deleted_at IS NULL
                "#,
            )
            .bind(user_id)
            .bind(cmd.user.email.is_some())
            .bind(cmd.user.email)
            .bind(cmd.user.phone.is_some())
            .bind(cmd.user.phone)
            .bind(cmd.user.nickname.is_some())
            .bind(cmd.user.nickname)
            .bind(cmd.user.avatar_url.is_some())
            .bind(cmd.user.avatar_url)
            .bind(chrono::Utc::now())
            .execute(&mut *tx)
            .await
            .map_err(Self::map_user_sqlx_error)?;

            if result.rows_affected() == 0 {
                return Err(AppError::not_found_here(format!("user not found: {user_id}")));
            }
        }

        if need_update_member {
            let result = sqlx::query(
                r#"
                UPDATE user_tenants
                SET
                    display_name = CASE WHEN $3 THEN $4 ELSE display_name END,
                    employee_no = CASE WHEN $5 THEN $6 ELSE employee_no END,
                    job_title = CASE WHEN $7 THEN $8 ELSE job_title END,
                    updated_at = $9
                WHERE user_id = $1
                  AND tenant_id = $2
                  AND deleted_at IS NULL
                "#,
            )
            .bind(user_id)
            .bind(tenant_id)
            .bind(cmd.membership.display_name.is_some())
            .bind(cmd.membership.display_name)
            .bind(cmd.membership.employee_no.is_some())
            .bind(cmd.membership.employee_no)
            .bind(cmd.membership.job_title.is_some())
            .bind(cmd.membership.job_title)
            .bind(chrono::Utc::now())
            .execute(&mut *tx)
            .await
            .map_err(|err| AppError::data_here(format!("failed to update tenant membership profile: {err}")))?;

            if result.rows_affected() == 0 {
                return Err(Self::member_not_found_error(user_id, tenant_id));
            }
        }

        tx.commit()
            .await
            .map_err(|err| AppError::data_here(format!("failed to commit update profile transaction: {err}")))?;

        self.invalidate_by_user_tenant(user_id, tenant_id).await?;
        self.get_profile(user_id, tenant_id).await
    }

    async fn invalidate_by_tenant(&self, tenant_id: i64) -> AppResult<()> {
        let prefix = self.tenant_cache_prefix(tenant_id);
        self.redis_pool
            .del_prefix(&prefix)
            .await
            .map_err(|err| AppError::data_here(format!("failed to invalidate tenant cache: {err}")))?;
        Ok(())
    }

    async fn invalidate_by_user_tenant(&self, user_id: i64, tenant_id: i64) -> AppResult<()> {
        let cache_key = self.user_tenant_cache_key(user_id, tenant_id);
        self.redis_pool
            .del(&cache_key)
            .await
            .map_err(|err| AppError::data_here(format!("failed to invalidate user-tenant cache: {err}")))?;
        Ok(())
    }
}
