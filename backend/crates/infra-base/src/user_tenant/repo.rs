use std::sync::Arc;

use chrono::Utc;
use domain_base::{
    TenantMemberView, UserTenant, UserTenantRepository,
    user_tenant::{TenantMemberPageQuery, UserTenantPageQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::{TenantMemberViewRow, UserTenantRow};

#[derive(Debug, Clone)]
pub struct SqlxUserTenantRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxUserTenantRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl UserTenantRepository for SqlxUserTenantRepository {
    async fn create(&self, user_tenant: &UserTenant) -> AppResult<UserTenant> {
        let row = sqlx::query_as::<_, UserTenantRow>(
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
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING
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
            "#,
        )
        .bind(&user_tenant.id)
        .bind(&user_tenant.user_id)
        .bind(&user_tenant.tenant_id)
        .bind(&user_tenant.display_name)
        .bind(&user_tenant.employee_no)
        .bind(&user_tenant.job_title)
        .bind(&user_tenant.status)
        .bind(&user_tenant.is_default)
        .bind(&user_tenant.is_tenant_admin)
        .bind(&user_tenant.joined_at)
        .bind(&user_tenant.invited_by)
        .bind(&user_tenant.created_at)
        .bind(&user_tenant.updated_at)
        .bind(&user_tenant.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<UserTenant>> {
        let row = sqlx::query_as::<_, UserTenantRow>(
            r#"
            SELECT
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
            FROM user_tenants
            WHERE id = $1
              AND deleted_at IS NULL
            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &UserTenantPageQuery) -> AppResult<(Vec<UserTenant>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM user_tenants
            WHERE 1 = 1
              AND deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            count_builder.push(" AND status = ");
            count_builder.push_bind(status);
        }

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            count_builder.push(" AND (display_name ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR employee_no ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR job_title ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(")");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new(
            r#"
            SELECT
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
            FROM user_tenants
            WHERE 1 = 1
              AND deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            builder.push(" AND (display_name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR employee_no ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR job_title ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(")");
        }

        builder.push(" ORDER BY created_at DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<UserTenantRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, user_tenant: &UserTenant) -> AppResult<UserTenant> {
        let row = sqlx::query_as::<_, UserTenantRow>(
            r#"
            UPDATE user_tenants
            SET
                user_id = $2,
                tenant_id = $3,
                display_name = $4,
                employee_no = $5,
                job_title = $6,
                status = $7,
                is_default = $8,
                is_tenant_admin = $9,
                joined_at = $10,
                invited_by = $11,
                updated_at = $12
            WHERE id = $1
            RETURNING
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
            "#,
        )
        .bind(user_tenant.id)
        .bind(&user_tenant.user_id)
        .bind(&user_tenant.tenant_id)
        .bind(&user_tenant.display_name)
        .bind(&user_tenant.employee_no)
        .bind(&user_tenant.job_title)
        .bind(&user_tenant.status)
        .bind(&user_tenant.is_default)
        .bind(&user_tenant.is_tenant_admin)
        .bind(&user_tenant.joined_at)
        .bind(&user_tenant.invited_by)
        .bind(&user_tenant.updated_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let now = Utc::now();

        let mut builder = QueryBuilder::new("UPDATE user_tenants SET deleted_at = ");
        builder.push_bind(now);
        builder.push(", updated_at = ");
        builder.push_bind(now);
        builder.push(" WHERE id IN (");

        {
            let mut separated = builder.separated(", ");
            for id in ids {
                separated.push_bind(id);
            }
        }

        builder.push(")");
        builder
            .build()
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let mut builder = QueryBuilder::new("DELETE FROM user_tenants WHERE id IN (");

        {
            let mut separated = builder.separated(", ");
            for id in ids {
                separated.push_bind(id);
            }
        }

        builder.push(")");
        builder
            .build()
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>> {
        let row = sqlx::query_as::<_, UserTenantRow>(
            r#"
            SELECT
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
            FROM user_tenants
            WHERE user_id   = $1
              AND tenant_id = $2
              AND deleted_at IS NULL
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .bind(tenant_id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page_members_by_tenant(
        &self,
        query: &TenantMemberPageQuery,
    ) -> AppResult<(Vec<TenantMemberView>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM user_tenants ut
            INNER JOIN users u ON u.id = ut.user_id AND u.deleted_at IS NULL
            WHERE ut.deleted_at IS NULL
              AND ut.tenant_id =
            "#,
        );
        count_builder.push_bind(query.tenant_id);

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            count_builder.push(" AND (u.username ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR u.nickname ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR u.email ILIKE ");
            count_builder.push_bind(pattern);
            count_builder.push(")");
        }

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                ut.id,
                ut.user_id,
                ut.tenant_id,
                u.username,
                u.nickname,
                u.email,
                u.avatar_url,
                ut.display_name,
                ut.job_title,
                ut.status,
                ut.is_tenant_admin,
                ut.joined_at
            FROM user_tenants ut
            INNER JOIN users u ON u.id = ut.user_id AND u.deleted_at IS NULL
            WHERE ut.deleted_at IS NULL
              AND ut.tenant_id =
            "#,
        );
        builder.push_bind(query.tenant_id);

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            builder.push(" AND (u.username ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR u.nickname ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR u.email ILIKE ");
            builder.push_bind(pattern);
            builder.push(")");
        }

        builder.push(" ORDER BY ut.joined_at ASC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<TenantMemberViewRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }
}
