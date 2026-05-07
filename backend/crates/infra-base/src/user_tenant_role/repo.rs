use std::sync::Arc;

use domain_base::{
    UserTenantRole, UserTenantRoleRepository, user_tenant_role::UserTenantRolePageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::UserTenantRoleRow;

#[derive(Debug, Clone)]
pub struct SqlxUserTenantRoleRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxUserTenantRoleRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl UserTenantRoleRepository for SqlxUserTenantRoleRepository {
    async fn create(&self, user_tenant_role: &UserTenantRole) -> AppResult<UserTenantRole> {
        let row = sqlx::query_as::<_, UserTenantRoleRow>(
            r#"
            INSERT INTO user_tenant_roles (
                id,
                user_tenant_id,
                role_id,
                created_at
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                user_tenant_id,
                role_id,
                created_at
            "#,
        )
        .bind(&user_tenant_role.id)
        .bind(&user_tenant_role.user_tenant_id)
        .bind(&user_tenant_role.role_id)
        .bind(&user_tenant_role.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<UserTenantRole>> {
        let row = sqlx::query_as::<_, UserTenantRoleRow>(
            r#"
            SELECT
                id,
                user_tenant_id,
                role_id,
                created_at
            FROM user_tenant_roles
            WHERE id = $1

            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &UserTenantRolePageQuery) -> AppResult<(Vec<UserTenantRole>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM user_tenant_roles
            WHERE 1 = 1

            "#,
        );

        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                user_tenant_id,
                role_id,
                created_at
            FROM user_tenant_roles
            WHERE 1 = 1

            "#,
        );

        builder.push(" ORDER BY created_at DESC");

        if let Some(limit) = query.limit {
            builder.push(" LIMIT ");
            builder.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            builder.push(" OFFSET ");
            builder.push_bind(offset);
        }

        let rows: Vec<UserTenantRoleRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, user_tenant_role: &UserTenantRole) -> AppResult<UserTenantRole> {
        let row = sqlx::query_as::<_, UserTenantRoleRow>(
            r#"
            UPDATE user_tenant_roles
            SET
                user_tenant_id = $2,
                role_id = $3
            WHERE id = $1
            RETURNING
                id,
                user_tenant_id,
                role_id,
                created_at
            "#,
        )
        .bind(user_tenant_role.id)
        .bind(&user_tenant_role.user_tenant_id)
        .bind(&user_tenant_role.role_id)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        self.hard_delete_batch(ids).await
    }

    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let mut builder = QueryBuilder::new("DELETE FROM user_tenant_roles WHERE id IN (");

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

    async fn list_by_membership(&self, user_tenant_id: i64) -> AppResult<Vec<UserTenantRole>> {
        let rows = sqlx::query_as::<_, UserTenantRoleRow>(
            r#"
            SELECT
                id,
                user_tenant_id,
                role_id,
                created_at
            FROM user_tenant_roles
            WHERE user_tenant_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(user_tenant_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn replace_by_membership(&self, user_tenant_id: i64, role_ids: &[i64]) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        // Remove all existing bindings for this membership.
        sqlx::query("DELETE FROM user_tenant_roles WHERE user_tenant_id = $1")
            .bind(user_tenant_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        // Insert the new bindings (if any).
        for &role_id in role_ids {
            let id = generate_sonyflake_id() as i64;
            sqlx::query(
                r#"
                INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
                VALUES ($1, $2, $3, NOW())
                "#,
            )
            .bind(id)
            .bind(user_tenant_id)
            .bind(role_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;
        }

        tx.commit().await.map_err(Self::map_sqlx_error)?;

        Ok(())
    }
}
