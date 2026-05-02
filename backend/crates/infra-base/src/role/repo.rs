use std::sync::Arc;

use chrono::Utc;
use domain_base::{Role, RoleRepository, role::RolePageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::RoleRow;

#[derive(Debug, Clone)]
pub struct SqlxRoleRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxRoleRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl RoleRepository for SqlxRoleRepository {
    async fn create(&self, role: &Role) -> AppResult<Role> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            INSERT INTO roles (
                id,
                tenant_id,
                code,
                name,
                description,
                status,
                is_builtin,
                sort,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING
                id,
                tenant_id,
                code,
                name,
                description,
                status,
                is_builtin,
                sort,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(&role.id)
        .bind(&role.tenant_id)
        .bind(&role.code)
        .bind(&role.name)
        .bind(&role.description)
        .bind(&role.status)
        .bind(&role.is_builtin)
        .bind(&role.sort)
        .bind(&role.created_at)
        .bind(&role.updated_at)
        .bind(&role.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<Role>> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            SELECT
                id,
                tenant_id,
                code,
                name,
                description,
                status,
                is_builtin,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM roles
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

    async fn page(&self, query: &RolePageQuery) -> AppResult<(Vec<Role>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM roles
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
            count_builder.push(" AND (code ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR name ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR description ILIKE ");
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
                tenant_id,
                code,
                name,
                description,
                status,
                is_builtin,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM roles
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
            builder.push(" AND (code ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR description ILIKE ");
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

        let rows: Vec<RoleRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, role: &Role) -> AppResult<Role> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            UPDATE roles
            SET
                tenant_id = $2,
                code = $3,
                name = $4,
                description = $5,
                status = $6,
                is_builtin = $7,
                sort = $8,
                updated_at = $9
            WHERE id = $1
            RETURNING
                id,
                tenant_id,
                code,
                name,
                description,
                status,
                is_builtin,
                sort,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(role.id)
        .bind(&role.tenant_id)
        .bind(&role.code)
        .bind(&role.name)
        .bind(&role.description)
        .bind(&role.status)
        .bind(&role.is_builtin)
        .bind(&role.sort)
        .bind(&role.updated_at)
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

        let mut builder = QueryBuilder::new(
            "UPDATE roles SET deleted_at = "
        );
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

        let mut builder = QueryBuilder::new("DELETE FROM roles WHERE id IN (");

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
