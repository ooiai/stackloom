use std::sync::Arc;

use chrono::Utc;
use common::core::biz_error::ROLE_CODE_EXISTS;
use domain_base::{
    Role, RoleRepository,
    role::{RoleChildrenQuery, RolePageQuery, RoleTreeQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Error as SqlxError, QueryBuilder};

use super::RoleRow;

#[derive(Debug, Clone)]
pub struct SqlxRoleRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxRoleRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505")
                && matches!(
                    db_err.constraint(),
                    Some("uq_roles_system_code") | Some("uq_roles_tenant_code")
                )
            {
                return AppError::DataError(
                    ROLE_CODE_EXISTS,
                    "role code already exists".to_string(),
                );
            }
        }

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
                parent_id,
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
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING
                id,
                tenant_id,
                parent_id,
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
        .bind(&role.parent_id)
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
                parent_id,
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

    async fn find_by_code(&self, code: &str) -> AppResult<Option<Role>> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
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

    async fn find_system_role_by_code(&self, code: &str) -> AppResult<Option<Role>> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
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
            WHERE tenant_id IS NULL
              AND code = $1
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
                parent_id,
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

    async fn list_for_tree(&self, query: &RoleTreeQuery) -> AppResult<Vec<Role>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
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
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        if let Some(is_builtin) = query.is_builtin {
            builder.push(" AND is_builtin = ");
            builder.push_bind(is_builtin);
        }

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<RoleRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn list_by_parent(&self, query: &RoleChildrenQuery) -> AppResult<Vec<Role>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
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

        if let Some(is_builtin) = query.is_builtin {
            builder.push(" AND is_builtin = ");
            builder.push_bind(is_builtin);
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

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<RoleRow> = builder
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
            FROM roles
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
            WITH RECURSIVE role_tree AS (
                SELECT id, parent_id
                FROM roles
                WHERE id = $1
                  AND deleted_at IS NULL
                UNION ALL
                SELECT child.id, child.parent_id
                FROM roles child
                INNER JOIN role_tree parent ON child.parent_id = parent.id
                WHERE child.deleted_at IS NULL
            )
            SELECT id
            FROM role_tree
            "#,
        )
        .bind(id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(ids)
    }

    async fn update(&self, role: &Role) -> AppResult<Role> {
        let row = sqlx::query_as::<_, RoleRow>(
            r#"
            UPDATE roles
            SET
                tenant_id = $2,
                parent_id = $3,
                code = $4,
                name = $5,
                description = $6,
                status = $7,
                is_builtin = $8,
                sort = $9,
                updated_at = $10
            WHERE id = $1
            RETURNING
                id,
                tenant_id,
                parent_id,
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
        .bind(&role.parent_id)
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

        let mut builder = QueryBuilder::new("UPDATE roles SET deleted_at = ");
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

        for table in ["role_menus", "role_perms"] {
            let mut builder = QueryBuilder::new(format!("DELETE FROM {table} WHERE role_id IN ("));
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

    async fn list_for_tenant(&self, tenant_id: i64) -> AppResult<Vec<Role>> {
        let rows = sqlx::query_as::<_, RoleRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
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
            WHERE (tenant_id IS NULL OR tenant_id = $1)
              AND status = 1
              AND deleted_at IS NULL
            ORDER BY sort ASC, created_at ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn get_role_menus(&self, role_id: i64) -> AppResult<Vec<i64>> {
        let rows =
            sqlx::query_scalar::<_, i64>("SELECT menu_id FROM role_menus WHERE role_id = $1")
                .bind(role_id)
                .fetch_all(self.pool.pool())
                .await
                .map_err(Self::map_sqlx_error)?;

        Ok(rows)
    }

    async fn get_role_menu_codes(&self, role_id: i64) -> AppResult<Vec<String>> {
        let rows = sqlx::query_scalar::<_, String>(
            "SELECT m.code FROM menus m \
             INNER JOIN role_menus rm ON m.id = rm.menu_id \
             WHERE rm.role_id = $1 AND m.deleted_at IS NULL",
        )
        .bind(role_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows)
    }

    async fn replace_role_menus(&self, role_id: i64, menu_ids: &[i64]) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        sqlx::query("DELETE FROM role_menus WHERE role_id = $1")
            .bind(role_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        let now = chrono::Utc::now();
        for &menu_id in menu_ids {
            sqlx::query(
                r#"
                INSERT INTO role_menus (id, role_id, menu_id, created_at)
                VALUES ($1, $2, $3, $4)
                "#,
            )
            .bind(neocrates::helper::core::snowflake::generate_sonyflake_id() as i64)
            .bind(role_id)
            .bind(menu_id)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;
        }

        tx.commit().await.map_err(Self::map_sqlx_error)?;
        Ok(())
    }

    async fn get_role_perms(&self, role_id: i64) -> AppResult<Vec<i64>> {
        let rows =
            sqlx::query_scalar::<_, i64>("SELECT perm_id FROM role_perms WHERE role_id = $1")
                .bind(role_id)
                .fetch_all(self.pool.pool())
                .await
                .map_err(Self::map_sqlx_error)?;

        Ok(rows)
    }

    async fn get_role_perm_codes(&self, role_id: i64) -> AppResult<Vec<String>> {
        let rows = sqlx::query_scalar::<_, String>(
            "SELECT p.code FROM perms p \
             INNER JOIN role_perms rp ON p.id = rp.perm_id \
             WHERE rp.role_id = $1 AND p.deleted_at IS NULL",
        )
        .bind(role_id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(rows)
    }

    async fn replace_role_perms(&self, role_id: i64, perm_ids: &[i64]) -> AppResult<()> {
        let mut tx = self
            .pool
            .pool()
            .begin()
            .await
            .map_err(Self::map_sqlx_error)?;

        sqlx::query("DELETE FROM role_perms WHERE role_id = $1")
            .bind(role_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

        let now = chrono::Utc::now();
        for &perm_id in perm_ids {
            sqlx::query(
                r#"
                INSERT INTO role_perms (id, role_id, perm_id, created_at)
                VALUES ($1, $2, $3, $4)
                "#,
            )
            .bind(neocrates::helper::core::snowflake::generate_sonyflake_id() as i64)
            .bind(role_id)
            .bind(perm_id)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;
        }

        tx.commit().await.map_err(Self::map_sqlx_error)?;
        Ok(())
    }
}
