use std::sync::Arc;

use chrono::Utc;
use domain_base::{Dict, DictRepository, dict::DictPageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::DictRow;

#[derive(Debug, Clone)]
pub struct SqlxDictRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxDictRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl DictRepository for SqlxDictRepository {
    async fn create(&self, dict: &Dict) -> AppResult<Dict> {
        let row = sqlx::query_as::<_, DictRow>(
            r#"
            INSERT INTO dicts (
                id,
                tenant_id,
                parent_id,
                dict_type,
                dict_key,
                dict_value,
                label,
                value_type,
                description,
                sort,
                status,
                is_builtin,
                is_leaf,
                ext,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING
                id,
                tenant_id,
                parent_id,
                dict_type,
                dict_key,
                dict_value,
                label,
                value_type,
                description,
                sort,
                status,
                is_builtin,
                is_leaf,
                ext,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(&dict.id)
        .bind(&dict.tenant_id)
        .bind(&dict.parent_id)
        .bind(&dict.dict_type)
        .bind(&dict.dict_key)
        .bind(&dict.dict_value)
        .bind(&dict.label)
        .bind(&dict.value_type)
        .bind(&dict.description)
        .bind(&dict.sort)
        .bind(&dict.status)
        .bind(&dict.is_builtin)
        .bind(&dict.is_leaf)
        .bind(&dict.ext)
        .bind(&dict.created_at)
        .bind(&dict.updated_at)
        .bind(&dict.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<Dict>> {
        let row = sqlx::query_as::<_, DictRow>(
            r#"
            SELECT
                id,
                tenant_id,
                parent_id,
                dict_type,
                dict_key,
                dict_value,
                label,
                value_type,
                description,
                sort,
                status,
                is_builtin,
                is_leaf,
                ext,
                created_at,
                updated_at,
                deleted_at
            FROM dicts
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

    async fn page(&self, query: &DictPageQuery) -> AppResult<(Vec<Dict>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM dicts
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
            count_builder.push(" AND (dict_type ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR dict_key ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR dict_value ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR label ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR value_type ILIKE ");
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
                dict_type,
                dict_key,
                dict_value,
                label,
                value_type,
                description,
                sort,
                status,
                is_builtin,
                is_leaf,
                ext,
                created_at,
                updated_at,
                deleted_at
            FROM dicts
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
            builder.push(" AND (dict_type ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR dict_key ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR dict_value ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR label ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR value_type ILIKE ");
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

        let rows: Vec<DictRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, dict: &Dict) -> AppResult<Dict> {
        let row = sqlx::query_as::<_, DictRow>(
            r#"
            UPDATE dicts
            SET
                tenant_id = $2,
                parent_id = $3,
                dict_type = $4,
                dict_key = $5,
                dict_value = $6,
                label = $7,
                value_type = $8,
                description = $9,
                sort = $10,
                status = $11,
                is_builtin = $12,
                is_leaf = $13,
                ext = $14,
                updated_at = $15
            WHERE id = $1
            RETURNING
                id,
                tenant_id,
                parent_id,
                dict_type,
                dict_key,
                dict_value,
                label,
                value_type,
                description,
                sort,
                status,
                is_builtin,
                is_leaf,
                ext,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(dict.id)
        .bind(&dict.tenant_id)
        .bind(&dict.parent_id)
        .bind(&dict.dict_type)
        .bind(&dict.dict_key)
        .bind(&dict.dict_value)
        .bind(&dict.label)
        .bind(&dict.value_type)
        .bind(&dict.description)
        .bind(&dict.sort)
        .bind(&dict.status)
        .bind(&dict.is_builtin)
        .bind(&dict.is_leaf)
        .bind(&dict.ext)
        .bind(&dict.updated_at)
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
            "UPDATE dicts SET deleted_at = "
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

        let mut builder = QueryBuilder::new("DELETE FROM dicts WHERE id IN (");

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
