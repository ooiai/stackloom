use std::sync::Arc;

use chrono::Utc;
use domain_base::{
    Tenant, TenantRepository,
    tenant::{TenantChildrenQuery, TenantPageQuery, TenantTreeQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::TenantRow;

#[derive(Debug, Clone)]
pub struct SqlxTenantRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxTenantRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl TenantRepository for SqlxTenantRepository {
    async fn create(&self, tenant: &Tenant) -> AppResult<Tenant> {
        let row = sqlx::query_as::<_, TenantRow>(
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
            RETURNING
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
            "#,
        )
        .bind(&tenant.id)
        .bind(&tenant.parent_id)
        .bind(&tenant.slug)
        .bind(&tenant.name)
        .bind(&tenant.description)
        .bind(&tenant.owner_user_id)
        .bind(&tenant.status)
        .bind(&tenant.plan_code)
        .bind(&tenant.expired_at)
        .bind(&tenant.created_at)
        .bind(&tenant.updated_at)
        .bind(&tenant.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<Tenant>> {
        let row = sqlx::query_as::<_, TenantRow>(
            r#"
            SELECT
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
            FROM tenants
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

    async fn page(&self, query: &TenantPageQuery) -> AppResult<(Vec<Tenant>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM tenants
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
            count_builder.push(" AND (slug ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR name ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR description ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR plan_code ILIKE ");
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
            FROM tenants
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
            builder.push(" AND (slug ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR description ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR plan_code ILIKE ");
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

        let rows: Vec<TenantRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list_for_tree(&self, query: &TenantTreeQuery) -> AppResult<Vec<Tenant>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
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
            FROM tenants
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        builder.push(" ORDER BY name ASC, created_at ASC");

        let rows: Vec<TenantRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn list_by_parent(&self, query: &TenantChildrenQuery) -> AppResult<Vec<Tenant>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
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
            FROM tenants
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(parent_id) = query.parent_id {
            builder.push(" AND parent_id = ");
            builder.push_bind(parent_id);
        } else {
            builder.push(" AND parent_id IS NULL");
        }

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            builder.push(" AND (slug ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR description ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR plan_code ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(")");
        }

        builder.push(" ORDER BY name ASC, created_at ASC");

        let rows: Vec<TenantRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn count_by_parent_id(&self, parent_id: i64) -> AppResult<i64> {
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) AS total
            FROM tenants
            WHERE parent_id = $1
              AND deleted_at IS NULL
            "#,
        )
        .bind(parent_id)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(total)
    }

    async fn find_descendant_ids(&self, id: i64) -> AppResult<Vec<i64>> {
        let ids = sqlx::query_scalar::<_, i64>(
            r#"
            WITH RECURSIVE tenant_tree AS (
                SELECT id, parent_id
                FROM tenants
                WHERE id = $1
                  AND deleted_at IS NULL
                UNION ALL
                SELECT child.id, child.parent_id
                FROM tenants child
                INNER JOIN tenant_tree parent ON child.parent_id = parent.id
                WHERE child.deleted_at IS NULL
            )
            SELECT id
            FROM tenant_tree
            "#,
        )
        .bind(id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(ids)
    }

    async fn update(&self, tenant: &Tenant) -> AppResult<Tenant> {
        let row = sqlx::query_as::<_, TenantRow>(
            r#"
            UPDATE tenants
            SET
                parent_id = $2,
                slug = $3,
                name = $4,
                description = $5,
                owner_user_id = $6,
                status = $7,
                plan_code = $8,
                expired_at = $9,
                updated_at = $10
            WHERE id = $1
            RETURNING
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
            "#,
        )
        .bind(tenant.id)
        .bind(&tenant.parent_id)
        .bind(&tenant.slug)
        .bind(&tenant.name)
        .bind(&tenant.description)
        .bind(&tenant.owner_user_id)
        .bind(&tenant.status)
        .bind(&tenant.plan_code)
        .bind(&tenant.expired_at)
        .bind(&tenant.updated_at)
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

        let mut builder = QueryBuilder::new("UPDATE tenants SET deleted_at = ");
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

        let mut builder = QueryBuilder::new("DELETE FROM tenants WHERE id IN (");

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
}
