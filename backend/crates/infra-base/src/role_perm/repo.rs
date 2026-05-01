use std::sync::Arc;

use domain_base::{RolePerm, RolePermRepository, role_perm::RolePermPageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::RolePermRow;

#[derive(Debug, Clone)]
pub struct SqlxRolePermRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxRolePermRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl RolePermRepository for SqlxRolePermRepository {
    async fn create(&self, role_perm: &RolePerm) -> AppResult<RolePerm> {
        let row = sqlx::query_as::<_, RolePermRow>(
            r#"
            INSERT INTO role_perms (
                id,
                role_id,
                perm_id,
                created_at
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                role_id,
                perm_id,
                created_at
            "#,
        )
        .bind(&role_perm.id)
        .bind(&role_perm.role_id)
        .bind(&role_perm.perm_id)
        .bind(&role_perm.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<RolePerm>> {
        let row = sqlx::query_as::<_, RolePermRow>(
            r#"
            SELECT
                id,
                role_id,
                perm_id,
                created_at
            FROM role_perms
            WHERE id = $1

            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &RolePermPageQuery) -> AppResult<(Vec<RolePerm>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM role_perms
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
                role_id,
                perm_id,
                created_at
            FROM role_perms
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

        let rows: Vec<RolePermRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, role_perm: &RolePerm) -> AppResult<RolePerm> {
        let row = sqlx::query_as::<_, RolePermRow>(
            r#"
            UPDATE role_perms
            SET
                role_id = $2,
                perm_id = $3
            WHERE id = $1
            RETURNING
                id,
                role_id,
                perm_id,
                created_at
            "#,
        )
        .bind(role_perm.id)
        .bind(&role_perm.role_id)
        .bind(&role_perm.perm_id)
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

        let mut builder = QueryBuilder::new("DELETE FROM role_perms WHERE id IN (");

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
