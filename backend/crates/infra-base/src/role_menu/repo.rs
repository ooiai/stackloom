use std::sync::Arc;

use domain_base::{RoleMenu, RoleMenuRepository, role_menu::RoleMenuPageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::RoleMenuRow;

#[derive(Debug, Clone)]
pub struct SqlxRoleMenuRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxRoleMenuRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl RoleMenuRepository for SqlxRoleMenuRepository {
    async fn create(&self, role_menu: &RoleMenu) -> AppResult<RoleMenu> {
        let row = sqlx::query_as::<_, RoleMenuRow>(
            r#"
            INSERT INTO role_menus (
                id,
                role_id,
                menu_id,
                created_at
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                role_id,
                menu_id,
                created_at
            "#,
        )
        .bind(&role_menu.id)
        .bind(&role_menu.role_id)
        .bind(&role_menu.menu_id)
        .bind(&role_menu.created_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<RoleMenu>> {
        let row = sqlx::query_as::<_, RoleMenuRow>(
            r#"
            SELECT
                id,
                role_id,
                menu_id,
                created_at
            FROM role_menus
            WHERE id = $1

            "#,
        )
        .bind(id)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &RoleMenuPageQuery) -> AppResult<(Vec<RoleMenu>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM role_menus
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
                menu_id,
                created_at
            FROM role_menus
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

        let rows: Vec<RoleMenuRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, role_menu: &RoleMenu) -> AppResult<RoleMenu> {
        let row = sqlx::query_as::<_, RoleMenuRow>(
            r#"
            UPDATE role_menus
            SET
                role_id = $2,
                menu_id = $3
            WHERE id = $1
            RETURNING
                id,
                role_id,
                menu_id,
                created_at
            "#,
        )
        .bind(role_menu.id)
        .bind(&role_menu.role_id)
        .bind(&role_menu.menu_id)
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

        let mut builder = QueryBuilder::new("DELETE FROM role_menus WHERE id IN (");

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
