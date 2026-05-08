use std::sync::Arc;

use chrono::Utc;
use common::core::biz_error::PERM_CODE_EXISTS;
use domain_base::{
    Perm, PermRepository,
    perm::{PermChildrenQuery, PermPageQuery, PermTreeQuery},
};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::{Error as SqlxError, QueryBuilder};

use super::PermRow;

#[derive(Debug, Clone)]
pub struct SqlxPermRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxPermRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: SqlxError) -> AppError {
        if let SqlxError::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505")
                && matches!(
                    db_err.constraint(),
                    Some("uq_perms_system_code") | Some("uq_perms_tenant_code")
                )
            {
                return AppError::DataError(
                    PERM_CODE_EXISTS,
                    "perm code already exists".to_string(),
                );
            }
        }

        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl PermRepository for SqlxPermRepository {
    async fn create(&self, perm: &Perm) -> AppResult<Perm> {
        let row = sqlx::query_as::<_, PermRow>(
            r#"
            INSERT INTO perms (
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(&perm.id)
        .bind(&perm.tenant_id)
        .bind(&perm.parent_id)
        .bind(&perm.code)
        .bind(&perm.name)
        .bind(&perm.resource)
        .bind(&perm.action)
        .bind(&perm.method)
        .bind(&perm.description)
        .bind(&perm.status)
        .bind(&perm.sort)
        .bind(&perm.created_at)
        .bind(&perm.updated_at)
        .bind(&perm.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<Perm>> {
        let row = sqlx::query_as::<_, PermRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM perms
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

    async fn find_by_code(&self, code: &str) -> AppResult<Option<Perm>> {
        let row = sqlx::query_as::<_, PermRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM perms
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

    async fn page(&self, query: &PermPageQuery) -> AppResult<(Vec<Perm>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM perms
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
            count_builder.push(" OR resource ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR action ILIKE ");
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
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM perms
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
            builder.push(" OR resource ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR action ILIKE ");
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

        let rows: Vec<PermRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn list_for_tree(&self, query: &PermTreeQuery) -> AppResult<Vec<Perm>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM perms
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<PermRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn list_by_parent(&self, query: &PermChildrenQuery) -> AppResult<Vec<Perm>> {
        let mut builder = QueryBuilder::new(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            FROM perms
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
            builder.push(" OR resource ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR action ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR description ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(")");
        }

        builder.push(" ORDER BY sort ASC, name ASC, created_at ASC");

        let rows: Vec<PermRow> = builder
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
            FROM perms
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
            WITH RECURSIVE perm_tree AS (
                SELECT id, parent_id
                FROM perms
                WHERE id = $1
                  AND deleted_at IS NULL
                UNION ALL
                SELECT child.id, child.parent_id
                FROM perms child
                INNER JOIN perm_tree parent ON child.parent_id = parent.id
                WHERE child.deleted_at IS NULL
            )
            SELECT id
            FROM perm_tree
            "#,
        )
        .bind(id)
        .fetch_all(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(ids)
    }

    async fn update(&self, perm: &Perm) -> AppResult<Perm> {
        let row = sqlx::query_as::<_, PermRow>(
            r#"
            UPDATE perms
            SET
                tenant_id = $2,
                parent_id = $3,
                code = $4,
                name = $5,
                resource = $6,
                action = $7,
                method = $8,
                description = $9,
                status = $10,
                sort = $11,
                updated_at = $12
            WHERE id = $1
            RETURNING
                id,
                tenant_id,
                parent_id,
                code,
                name,
                resource,
                action,
                method,
                description,
                status,
                sort,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(perm.id)
        .bind(&perm.tenant_id)
        .bind(&perm.parent_id)
        .bind(&perm.code)
        .bind(&perm.name)
        .bind(&perm.resource)
        .bind(&perm.action)
        .bind(&perm.method)
        .bind(&perm.description)
        .bind(&perm.status)
        .bind(&perm.sort)
        .bind(&perm.updated_at)
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

        let mut builder = QueryBuilder::new("UPDATE perms SET deleted_at = ");
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

        let mut cleanup_builder = QueryBuilder::new("DELETE FROM role_perms WHERE perm_id IN (");
        {
            let mut separated = cleanup_builder.separated(", ");
            for id in ids {
                separated.push_bind(id);
            }
        }
        cleanup_builder.push(")");
        cleanup_builder
            .build()
            .execute(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        let mut builder = QueryBuilder::new("DELETE FROM perms WHERE id IN (");
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
