use std::sync::Arc;

use common::core::biz_error::{TENANT_APPLY_ALREADY_PROCESSED, TENANT_APPLY_NOT_FOUND};
use domain_base::{
    TenantApplyRepository, TenantApplyView,
    tenant_apply::{ApproveTenantApplyCmd, BanTenantApplyCmd, PageTenantApplyCmd, RejectTenantApplyCmd},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::TenantApplyRow;

#[derive(Debug, Clone)]
pub struct SqlxTenantApplyRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxTenantApplyRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl TenantApplyRepository for SqlxTenantApplyRepository {
    async fn page(&self, cmd: &PageTenantApplyCmd) -> AppResult<(Vec<TenantApplyView>, i64)> {
        let limit = cmd.limit.unwrap_or(10).min(100);
        let offset = cmd.offset.unwrap_or(0).max(0);

        let rows = sqlx::query_as::<_, TenantApplyRow>(
            r#"
            SELECT
                ut.id,
                ut.user_id,
                ut.tenant_id,
                t.name         AS tenant_name,
                t.slug         AS tenant_slug,
                u.username     AS applicant_username,
                u.nickname     AS applicant_name,
                u.phone        AS applicant_phone,
                u.email        AS applicant_email,
                u.avatar_url   AS applicant_avatar,
                u.status       AS user_status,
                ut.status      AS membership_status,
                ut.created_at
            FROM user_tenants ut
            JOIN tenants t ON t.id = ut.tenant_id AND t.deleted_at IS NULL
            JOIN users   u ON u.id = ut.user_id   AND u.deleted_at IS NULL
            WHERE ut.deleted_at IS NULL
              AND ut.is_tenant_admin = TRUE
              AND ut.is_default = TRUE
              AND ut.invited_by IS NULL
              AND t.owner_user_id = ut.user_id
              AND ($1::SMALLINT IS NULL OR ut.status = $1)
              AND (
                    $2::TEXT IS NULL OR (
                        t.name ILIKE '%' || $2 || '%'
                        OR u.nickname ILIKE '%' || $2 || '%'
                        OR u.username ILIKE '%' || $2 || '%'
                        OR u.phone    ILIKE '%' || $2 || '%'
                    )
                  )
            ORDER BY ut.created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(cmd.status)
        .bind(cmd.keyword.as_deref())
        .bind(limit)
        .bind(offset)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        let total: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM user_tenants ut
            JOIN tenants t ON t.id = ut.tenant_id AND t.deleted_at IS NULL
            JOIN users   u ON u.id = ut.user_id   AND u.deleted_at IS NULL
            WHERE ut.deleted_at IS NULL
              AND ut.is_tenant_admin = TRUE
              AND ut.is_default = TRUE
              AND ut.invited_by IS NULL
              AND t.owner_user_id = ut.user_id
              AND ($1::SMALLINT IS NULL OR ut.status = $1)
              AND (
                    $2::TEXT IS NULL OR (
                        t.name ILIKE '%' || $2 || '%'
                        OR u.nickname ILIKE '%' || $2 || '%'
                        OR u.username ILIKE '%' || $2 || '%'
                        OR u.phone    ILIKE '%' || $2 || '%'
                    )
                  )
            "#,
        )
        .bind(cmd.status)
        .bind(cmd.keyword.as_deref())
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        let views: Vec<TenantApplyView> = rows.into_iter().map(Into::into).collect();
        Ok((views, total))
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<TenantApplyView>> {
        let row = sqlx::query_as::<_, TenantApplyRow>(
            r#"
            SELECT
                ut.id,
                ut.user_id,
                ut.tenant_id,
                t.name         AS tenant_name,
                t.slug         AS tenant_slug,
                u.username     AS applicant_username,
                u.nickname     AS applicant_name,
                u.phone        AS applicant_phone,
                u.email        AS applicant_email,
                u.avatar_url   AS applicant_avatar,
                u.status       AS user_status,
                ut.status      AS membership_status,
                ut.created_at
            FROM user_tenants ut
            JOIN tenants t ON t.id = ut.tenant_id AND t.deleted_at IS NULL
            JOIN users   u ON u.id = ut.user_id   AND u.deleted_at IS NULL
            WHERE ut.deleted_at IS NULL
              AND ut.is_tenant_admin = TRUE
              AND ut.is_default = TRUE
              AND ut.invited_by IS NULL
              AND t.owner_user_id = ut.user_id
              AND ut.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn approve(&self, cmd: &ApproveTenantApplyCmd) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        let current: Option<(i16,)> = sqlx::query_as(
            "SELECT status FROM user_tenants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
        )
        .bind(cmd.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        let (status,) = current.ok_or_else(|| {
            AppError::DataError(
                TENANT_APPLY_NOT_FOUND,
                format!("tenant apply not found: {}", cmd.id),
            )
        })?;

        if status != 2 {
            return Err(AppError::DataError(
                TENANT_APPLY_ALREADY_PROCESSED,
                format!("application {} is not pending (status={})", cmd.id, status),
            ));
        }

        sqlx::query("UPDATE user_tenants SET status = 1, updated_at = NOW() WHERE id = $1")
            .bind(cmd.id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn reject(&self, cmd: &RejectTenantApplyCmd) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        let current: Option<(i16,)> = sqlx::query_as(
            "SELECT status FROM user_tenants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
        )
        .bind(cmd.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        let (status,) = current.ok_or_else(|| {
            AppError::DataError(
                TENANT_APPLY_NOT_FOUND,
                format!("tenant apply not found: {}", cmd.id),
            )
        })?;

        if status != 2 {
            return Err(AppError::DataError(
                TENANT_APPLY_ALREADY_PROCESSED,
                format!("application {} is not pending (status={})", cmd.id, status),
            ));
        }

        sqlx::query("UPDATE user_tenants SET status = 0, updated_at = NOW() WHERE id = $1")
            .bind(cmd.id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn ban(&self, cmd: &BanTenantApplyCmd) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        let current: Option<(i64, i16)> = sqlx::query_as(
            "SELECT user_id, status FROM user_tenants WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
        )
        .bind(cmd.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(Self::map_sqlx_error)?;

        let (user_id, _status) = current.ok_or_else(|| {
            AppError::DataError(
                TENANT_APPLY_NOT_FOUND,
                format!("tenant apply not found: {}", cmd.id),
            )
        })?;

        sqlx::query("UPDATE user_tenants SET status = 0, updated_at = NOW() WHERE id = $1")
            .bind(cmd.id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        sqlx::query("UPDATE users SET status = 2, updated_at = NOW() WHERE id = $1")
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok(())
    }
}
