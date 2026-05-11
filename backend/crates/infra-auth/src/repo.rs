use common::core::biz_error::{
    AUTH_ACCOUNT_EXISTS, AUTH_TENANT_EXISTS, AUTH_TENANT_MEMBERSHIP_EXISTS,
    AUTH_TENANT_MEMBERSHIP_ROLE_EXISTS,
};
use std::{collections::HashMap, sync::Arc};

use domain_auth::{AccountSignupBundle, AuthRepository, RecoveryChannel, SigninTenantOption};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlx::{self, Error as SqlxError},
    sqlxhelper::pool::SqlxPool,
};

use super::{AuthTenantConflictRow, AuthUserAccountRow, SigninTenantMembershipRow};

/// SQLx-backed repository for signin/signup reads and writes.
#[derive(Debug, Clone)]
pub struct SqlxAuthRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxAuthRepository {
    /// Create a repository bound to the shared SQLx pool.
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    /// Normalize low-level SQL errors into business-facing auth errors.
    fn map_unique_violation(err: &(dyn sqlx::error::DatabaseError + 'static)) -> AppError {
        match err.constraint() {
            Some("uq_users_username") | Some("users_phone_key") | Some("users_email_key") => {
                AppError::DataError(AUTH_ACCOUNT_EXISTS, "account already exists".to_string())
            }
            Some("uq_tenants_slug") => {
                AppError::DataError(AUTH_TENANT_EXISTS, "tenant already exists".to_string())
            }
            Some("uq_user_tenants_user_tenant") => AppError::DataError(
                AUTH_TENANT_MEMBERSHIP_EXISTS,
                "tenant membership already exists".to_string(),
            ),
            Some("uq_user_tenant_roles") => AppError::DataError(
                AUTH_TENANT_MEMBERSHIP_ROLE_EXISTS,
                "tenant membership role already exists".to_string(),
            ),
            Some(
                "users_pkey"
                | "tenants_pkey"
                | "roles_pkey"
                | "user_tenants_pkey"
                | "user_tenant_roles_pkey",
            ) => AppError::data_here(format!(
                "unexpected primary key conflict during auth persistence: {}",
                err.message()
            )),
            Some(constraint) => AppError::data_here(format!(
                "unexpected unique constraint violation ({constraint}): {}",
                err.message()
            )),
            None => AppError::data_here(format!(
                "unexpected unique constraint violation: {}",
                err.message()
            )),
        }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505") {
                return Self::map_unique_violation(db_err.as_ref());
            }
        }

        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl AuthRepository for SqlxAuthRepository {
    /// Load one enabled auth account candidate by username or phone.
    async fn find_user_by_account(
        &self,
        account: &str,
    ) -> AppResult<Option<domain_auth::AuthUserAccount>> {
        let row = sqlx::query_as::<_, AuthUserAccountRow>(
            r#"
            SELECT
                id,
                username,
                email,
                phone,
                nickname,
                password_hash,
                status
            FROM users
            WHERE deleted_at IS NULL
              AND (username = $1 OR phone = $1)
            LIMIT 1
            "#,
        )
        .bind(account)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn find_user_by_id(
        &self,
        user_id: i64,
    ) -> AppResult<Option<domain_auth::AuthUserAccount>> {
        let row = sqlx::query_as::<_, AuthUserAccountRow>(
            r#"
            SELECT
                id,
                username,
                email,
                phone,
                nickname,
                password_hash,
                status
            FROM users
            WHERE deleted_at IS NULL
              AND id = $1
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    /// Check whether a tenant slug already exists before signup persists data.
    async fn find_tenant_by_slug(
        &self,
        slug: &str,
    ) -> AppResult<Option<domain_auth::AuthTenantConflict>> {
        let row = sqlx::query_as::<_, AuthTenantConflictRow>(
            r#"
            SELECT id, slug, name
            FROM tenants
            WHERE deleted_at IS NULL
              AND slug = $1
            LIMIT 1
            "#,
        )
        .bind(slug)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    /// Check whether the requested tenant name or slug conflicts with existing data.
    async fn find_tenant_by_name_or_slug(
        &self,
        name: &str,
        slug: &str,
    ) -> AppResult<Option<domain_auth::AuthTenantConflict>> {
        let row = sqlx::query_as::<_, AuthTenantConflictRow>(
            r#"
            SELECT id, slug, name
            FROM tenants
            WHERE deleted_at IS NULL
              AND (slug = $1 OR LOWER(name) = LOWER($2))
            LIMIT 1
            "#,
        )
        .bind(slug)
        .bind(name)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    /// Load all tenant memberships available to the specified user for signin.
    async fn list_signin_tenants(&self, user_id: i64) -> AppResult<Vec<SigninTenantOption>> {
        let rows = sqlx::query_as::<_, SigninTenantMembershipRow>(
            r#"
            SELECT
                ut.id AS membership_id,
                ut.tenant_id,
                t.name AS tenant_name,
                ut.display_name,
                CASE
                    WHEN ut.status = 1 AND t.status = 1 THEN 1
                    ELSE 0
                END::SMALLINT AS status,
                u.id AS user_id,
                u.username,
                u.nickname,
                r.id AS role_id,
                r.name AS role_name,
                r.code AS role_code
            FROM user_tenants ut
            JOIN users u
              ON u.id = ut.user_id
             AND u.deleted_at IS NULL
            JOIN tenants t
              ON t.id = ut.tenant_id
             AND t.deleted_at IS NULL
            LEFT JOIN user_tenant_roles utr
              ON utr.user_tenant_id = ut.id
            LEFT JOIN roles r
              ON r.id = utr.role_id
             AND r.deleted_at IS NULL
             AND r.status = 1
            WHERE ut.deleted_at IS NULL
              AND ut.user_id = $1
            ORDER BY ut.is_default DESC, t.name ASC, r.sort ASC, r.name ASC
            "#,
        )
        .bind(user_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        // One membership may join multiple role rows, so fold them into one option.
        let mut options_by_membership = HashMap::<i64, SigninTenantOption>::new();

        for row in rows {
            let entry = options_by_membership
                .entry(row.membership_id)
                .or_insert_with(|| SigninTenantOption {
                    membership_id: row.membership_id,
                    tenant_id: row.tenant_id,
                    tenant_name: row.tenant_name.clone(),
                    display_name: row.display_name.clone(),
                    status: row.status,
                    user_id: row.user_id,
                    username: row.username.clone(),
                    nickname: row.nickname.clone(),
                    role_ids: Vec::new(),
                    role_names: Vec::new(),
                    role_codes: Vec::new(),
                });

            if let Some(role_id) = row.role_id {
                if !entry.role_ids.contains(&role_id) {
                    entry.role_ids.push(role_id);
                }
            }

            if let Some(role_name) = row.role_name.as_ref() {
                if !entry.role_names.iter().any(|value| value == role_name) {
                    entry.role_names.push(role_name.clone());
                }
            }

            if let Some(role_code) = row.role_code.as_ref() {
                if !entry.role_codes.iter().any(|value| value == role_code) {
                    entry.role_codes.push(role_code.clone());
                }
            }
        }

        Ok(options_by_membership.into_values().collect())
    }

    /// Persist the full signup aggregate in one transaction to avoid partial writes.
    async fn create_account_signup_bundle(&self, bundle: &AccountSignupBundle) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        sqlx::query(
            r#"
            INSERT INTO users (
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::inet, $13, $14, $15
            )
            "#,
        )
        .bind(bundle.user.id)
        .bind(&bundle.user.username)
        .bind(&bundle.user.email)
        .bind(&bundle.user.phone)
        .bind(&bundle.user.password_hash)
        .bind(&bundle.user.nickname)
        .bind(&bundle.user.avatar_url)
        .bind(bundle.user.gender)
        .bind(bundle.user.status)
        .bind(&bundle.user.bio)
        .bind(bundle.user.last_login_at)
        .bind(&bundle.user.last_login_ip)
        .bind(bundle.user.created_at)
        .bind(bundle.user.updated_at)
        .bind(bundle.user.deleted_at)
        .execute(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        sqlx::query(
            r#"
            INSERT INTO tenants (
                id,
                parent_id,
                slug,
                name,
                description,
                owner_user_id,
                status,
                plan_code,
                expired_at,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
        )
        .bind(bundle.tenant.id)
        .bind(bundle.tenant.parent_id)
        .bind(&bundle.tenant.slug)
        .bind(&bundle.tenant.name)
        .bind(&bundle.tenant.description)
        .bind(bundle.tenant.owner_user_id)
        .bind(bundle.tenant.status)
        .bind(&bundle.tenant.plan_code)
        .bind(bundle.tenant.expired_at)
        .bind(bundle.tenant.created_at)
        .bind(bundle.tenant.updated_at)
        .bind(bundle.tenant.deleted_at)
        .execute(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        sqlx::query(
            r#"
            INSERT INTO user_tenants (
                id,
                user_id,
                tenant_id,
                display_name,
                employee_no,
                job_title,
                status,
                is_default,
                is_tenant_admin,
                joined_at,
                invited_by,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            "#,
        )
        .bind(bundle.user_tenant.id)
        .bind(bundle.user_tenant.user_id)
        .bind(bundle.user_tenant.tenant_id)
        .bind(&bundle.user_tenant.display_name)
        .bind(&bundle.user_tenant.employee_no)
        .bind(&bundle.user_tenant.job_title)
        .bind(bundle.user_tenant.status)
        .bind(bundle.user_tenant.is_default)
        .bind(bundle.user_tenant.is_tenant_admin)
        .bind(bundle.user_tenant.joined_at)
        .bind(bundle.user_tenant.invited_by)
        .bind(bundle.user_tenant.created_at)
        .bind(bundle.user_tenant.updated_at)
        .bind(bundle.user_tenant.deleted_at)
        .execute(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        sqlx::query(
            r#"
            INSERT INTO user_tenant_roles (
                id,
                user_tenant_id,
                role_id,
                created_at
            )
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(bundle.user_tenant_role.id)
        .bind(bundle.user_tenant_role.user_tenant_id)
        .bind(bundle.user_tenant_role.role_id)
        .bind(bundle.user_tenant_role.created_at)
        .execute(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn find_user_by_channel_account(
        &self,
        channel: RecoveryChannel,
        account: &str,
    ) -> AppResult<Option<domain_auth::AuthUserAccount>> {
        let row = match channel {
            RecoveryChannel::Phone => sqlx::query_as::<_, AuthUserAccountRow>(
                r#"
                    SELECT id, username, email, phone, nickname, password_hash, status
                    FROM users
                    WHERE deleted_at IS NULL
                      AND phone = $1
                    LIMIT 1
                    "#,
            )
            .bind(account)
            .fetch_optional(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?,
            RecoveryChannel::Email => sqlx::query_as::<_, AuthUserAccountRow>(
                r#"
                    SELECT id, username, email, phone, nickname, password_hash, status
                    FROM users
                    WHERE deleted_at IS NULL
                      AND LOWER(email) = LOWER($1)
                    LIMIT 1
                    "#,
            )
            .bind(account)
            .fetch_optional(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?,
        };

        Ok(row.map(Into::into))
    }

    async fn update_user_password_hash(&self, user_id: i64, password_hash: &str) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE users
            SET password_hash = $1,
                updated_at = NOW()
            WHERE id = $2
              AND deleted_at IS NULL
            "#,
        )
        .bind(password_hash)
        .bind(user_id)
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }
}
