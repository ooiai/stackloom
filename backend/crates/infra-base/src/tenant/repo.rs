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

use super::{TenantRow, TenantWithDefaultRow};

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

    fn tenant_select_columns() -> &'static str {
        r#"
            tenants.id,
            tenants.parent_id,
            tenants.slug,
            tenants.name,
            tenants.description,
            tenants.owner_user_id,
            tenants.status,
            tenants.plan_code,
            tenants.expired_at,
            tenants.created_at,
            tenants.updated_at,
            tenants.deleted_at,
            EXISTS (
                SELECT 1
                FROM tenants child
                WHERE child.parent_id = tenants.id
                  AND child.deleted_at IS NULL
            ) AS has_children
        "#
    }

    fn tenant_select_columns_with_alias(alias: &str) -> String {
        format!(
            r#"
                {alias}.id,
                {alias}.parent_id,
                {alias}.slug,
                {alias}.name,
                {alias}.description,
                {alias}.owner_user_id,
                {alias}.status,
                {alias}.plan_code,
                {alias}.expired_at,
                {alias}.created_at,
                {alias}.updated_at,
                {alias}.deleted_at,
                EXISTS (
                    SELECT 1
                    FROM tenants child
                    WHERE child.parent_id = {alias}.id
                      AND child.deleted_at IS NULL
                ) AS has_children
            "#
        )
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
                deleted_at,
                false AS has_children
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
        let sql = format!(
            r#"
            SELECT
                {}
            FROM tenants
            WHERE id = $1
              AND deleted_at IS NULL
            "#,
            Self::tenant_select_columns()
        );

        let row = sqlx::query_as::<_, TenantRow>(&sql)
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

        let mut builder = QueryBuilder::new(&format!(
            r#"
            SELECT
                {}
            FROM tenants
            WHERE 1 = 1
              AND deleted_at IS NULL
            "#,
            Self::tenant_select_columns()
        ));

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
        let mut builder = QueryBuilder::new(&format!(
            r#"
            SELECT
                {}
            FROM tenants
            WHERE deleted_at IS NULL
            "#,
            Self::tenant_select_columns()
        ));

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

    async fn list_by_parent(&self, query: &TenantChildrenQuery) -> AppResult<(Vec<Tenant>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM tenants
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(parent_id) = query.parent_id {
            count_builder.push(" AND parent_id = ");
            count_builder.push_bind(parent_id);
        } else {
            count_builder.push(" AND parent_id IS NULL");
        }

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

        let mut builder = QueryBuilder::new(&format!(
            r#"
            SELECT
                {}
            FROM tenants
            WHERE deleted_at IS NULL
            "#,
            Self::tenant_select_columns()
        ));

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

    async fn list_ancestors(&self, id: i64) -> AppResult<Vec<Tenant>> {
        let sql = format!(
            r#"
            WITH RECURSIVE tenant_path AS (
                SELECT
                    {},
                    0 AS depth
                FROM tenants current_tenant
                WHERE current_tenant.id = $1
                  AND current_tenant.deleted_at IS NULL
                UNION ALL
                SELECT
                    {},
                    tenant_path.depth + 1
                FROM tenants parent_tenant
                INNER JOIN tenant_path ON parent_tenant.id = tenant_path.parent_id
                WHERE parent_tenant.deleted_at IS NULL
            )
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
                deleted_at,
                has_children
            FROM tenant_path
            ORDER BY depth DESC
            "#,
            Self::tenant_select_columns_with_alias("current_tenant"),
            Self::tenant_select_columns_with_alias("parent_tenant")
        );

        let rows: Vec<TenantRow> = sqlx::query_as::<_, TenantRow>(&sql)
            .bind(id)
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
                deleted_at,
                EXISTS (
                    SELECT 1
                    FROM tenants child
                    WHERE child.parent_id = tenants.id
                      AND child.deleted_at IS NULL
                ) AS has_children
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

    async fn list_by_user_id(&self, user_id: i64) -> AppResult<Vec<(Tenant, bool)>> {
        let rows = sqlx::query_as::<_, TenantWithDefaultRow>(
            r#"
            SELECT
                t.id,
                t.parent_id,
                t.slug,
                t.name,
                t.description,
                t.owner_user_id,
                t.status,
                t.plan_code,
                t.expired_at,
                t.created_at,
                t.updated_at,
                t.deleted_at,
                EXISTS (
                    SELECT 1
                    FROM tenants child
                    WHERE child.parent_id = t.id
                      AND child.deleted_at IS NULL
                ) AS has_children,
                ut.is_default
            FROM tenants t
            INNER JOIN user_tenants ut ON t.id = ut.tenant_id
            WHERE ut.user_id = $1
              AND ut.deleted_at IS NULL
              AND t.deleted_at IS NULL
            ORDER BY ut.is_default DESC, t.id ASC
            "#,
        )
        .bind(user_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(<(Tenant, bool)>::from).collect())
    }
}
