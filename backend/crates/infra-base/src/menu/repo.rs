use std::sync::Arc;

use chrono::Utc;
use common::core::biz_error::MENU_CODE_EXISTS;
use domain_base::{
    Menu, MenuRepository,
    menu::{MenuChildrenQuery, MenuPageQuery, MenuTreeQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Error as SqlxError, QueryBuilder};

use super::MenuRow;

#[derive(Debug, Clone)]
pub struct SqlxMenuRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxMenuRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505")
                && matches!(
                    db_err.constraint(),
                    Some("uq_menus_system_code") | Some("uq_menus_tenant_code")
                )
            {
                return AppError::DataError(
                    MENU_CODE_EXISTS,
                    "menu code already exists".to_string(),
                );
            }
        }

        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl MenuRepository for SqlxMenuRepository {
    async fn create(&self, menu: &Menu) -> AppResult<Menu> {
        let row = sqlx::query_as::<_, MenuRow>(
            r#"
            INSERT INTO menus (
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(&menu.id)
        .bind(&menu.tenant_id)
        .bind(&menu.parent_id)
        .bind(&menu.code)
        .bind(&menu.name)
        .bind(&menu.description)
        .bind(&menu.path)
        .bind(&menu.component)
        .bind(&menu.redirect)
        .bind(&menu.icon)
        .bind(&menu.menu_type)
        .bind(&menu.sort)
        .bind(&menu.visible)
        .bind(&menu.keep_alive)
        .bind(&menu.status)
        .bind(&menu.created_at)
        .bind(&menu.updated_at)
        .bind(&menu.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<Menu>> {
        let row = sqlx::query_as::<_, MenuRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            FROM menus
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

    async fn find_by_code(&self, code: &str) -> AppResult<Option<Menu>> {
        let row = sqlx::query_as::<_, MenuRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            FROM menus
            WHERE code = $1
              AND deleted_at IS NULL
            LIMIT 1
            "#,
        )
        .bind(code)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &MenuPageQuery) -> AppResult<(Vec<Menu>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM menus
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
            count_builder.push(" OR path ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR component ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR redirect ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR icon ILIKE ");
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
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            FROM menus
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
            builder.push(" OR path ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR component ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR redirect ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR icon ILIKE ");
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

        let rows: Vec<MenuRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list_for_tree(&self, query: &MenuTreeQuery) -> AppResult<Vec<Menu>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            FROM menus
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<MenuRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn list_by_parent(&self, query: &MenuChildrenQuery) -> AppResult<Vec<Menu>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            FROM menus
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
            builder.push(" AND (code ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR name ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR path ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR component ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR redirect ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR icon ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(")");
        }

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<MenuRow> = builder
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
            FROM menus
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
            WITH RECURSIVE menu_tree AS (
                SELECT id, parent_id
                FROM menus
                WHERE id = $1
                  AND deleted_at IS NULL
                UNION ALL
                SELECT child.id, child.parent_id
                FROM menus child
                INNER JOIN menu_tree parent ON child.parent_id = parent.id
                WHERE child.deleted_at IS NULL
            )
            SELECT id
            FROM menu_tree
            "#,
        )
        .bind(id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(ids)
    }

    async fn list_menu_ids_by_role_ids(&self, role_ids: &[i64]) -> AppResult<Vec<i64>> {
        if role_ids.is_empty() {
            return Ok(Vec::new());
        }

        let mut builder = QueryBuilder::new(
            r#"
            SELECT DISTINCT rm.menu_id
            FROM role_menus rm
            INNER JOIN menus m ON m.id = rm.menu_id
            WHERE m.deleted_at IS NULL
              AND rm.role_id IN (
            "#,
        );
        let mut separated = builder.separated(", ");
        for role_id in role_ids {
            separated.push_bind(role_id);
        }
        separated.push_unseparated(")");

        let menu_ids = builder
            .build_query_scalar::<i64>()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(menu_ids)
    }

    async fn update(&self, menu: &Menu) -> AppResult<Menu> {
        let row = sqlx::query_as::<_, MenuRow>(
            r#"
            UPDATE menus
            SET
                tenant_id = $2,
                parent_id = $3,
                code = $4,
                name = $5,
                description = $6,
                path = $7,
                component = $8,
                redirect = $9,
                icon = $10,
                menu_type = $11,
                sort = $12,
                visible = $13,
                keep_alive = $14,
                status = $15,
                updated_at = $16
            WHERE id = $1
            RETURNING
                id,
                tenant_id,
                parent_id,
                code,
                name,
                description,
                path,
                component,
                redirect,
                icon,
                menu_type,
                sort,
                visible,
                keep_alive,
                status,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(menu.id)
        .bind(&menu.tenant_id)
        .bind(&menu.parent_id)
        .bind(&menu.code)
        .bind(&menu.name)
        .bind(&menu.description)
        .bind(&menu.path)
        .bind(&menu.component)
        .bind(&menu.redirect)
        .bind(&menu.icon)
        .bind(&menu.menu_type)
        .bind(&menu.sort)
        .bind(&menu.visible)
        .bind(&menu.keep_alive)
        .bind(&menu.status)
        .bind(&menu.updated_at)
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

        let mut builder = QueryBuilder::new("UPDATE menus SET deleted_at = ");
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

        let mut builder = QueryBuilder::new("DELETE FROM menus WHERE id IN (");

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
