use std::sync::Arc;

use chrono::Utc;
use domain_base::{User, UserRepository, user::UserPageQuery};
use neocrates::{
    async_trait::async_trait,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};
use sqlx::QueryBuilder;

use super::UserRow;

#[derive(Debug, Clone)]
pub struct SqlxUserRepository {
    pool: Arc<SqlxPool>,
}

impl SqlxUserRepository {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> AppError {
        AppError::data_here(err.to_string())
    }
}

#[async_trait]
impl UserRepository for SqlxUserRepository {
    async fn create(&self, user: &User) -> AppResult<User> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            INSERT INTO users (
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(user.id)
        .bind(&user.username)
        .bind(&user.email)
        .bind(&user.phone)
        .bind(&user.password_hash)
        .bind(&user.nickname)
        .bind(&user.avatar_url)
        .bind(user.gender)
        .bind(user.status)
        .bind(&user.bio)
        .bind(user.last_login_at)
        .bind(&user.last_login_ip)
        .bind(user.created_at)
        .bind(user.updated_at)
        .bind(user.deleted_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn find_by_id(&self, id: i64) -> AppResult<Option<User>> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            FROM users
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

    async fn find_by_username(&self, username: &str) -> AppResult<Option<User>> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            FROM users
            WHERE username = $1
              AND deleted_at IS NULL
            "#,
        )
        .bind(username)
        .fetch_optional(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.map(Into::into))
    }

    async fn page(&self, query: &UserPageQuery) -> AppResult<(Vec<User>, i64)> {
        let mut count_builder = QueryBuilder::new(
            r#"
            SELECT COUNT(*) AS total
            FROM users
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            count_builder.push(" AND status = ");
            count_builder.push_bind(status);
        }

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            count_builder.push(" AND (username ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR nickname ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR email ILIKE ");
            count_builder.push_bind(pattern.clone());
            count_builder.push(" OR phone ILIKE ");
            count_builder.push_bind(pattern);
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
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            FROM users
            WHERE deleted_at IS NULL
            "#,
        );

        if let Some(status) = query.status {
            builder.push(" AND status = ");
            builder.push_bind(status);
        }

        if let Some(keyword) = query.keyword.as_ref() {
            let pattern = format!("%{}%", keyword.trim());
            builder.push(" AND (username ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR nickname ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR email ILIKE ");
            builder.push_bind(pattern.clone());
            builder.push(" OR phone ILIKE ");
            builder.push_bind(pattern);
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

        let rows: Vec<UserRow> = builder
            .build_query_as()
            .fetch_all(self.pool.pool())
            .await
            .map_err(Self::map_sqlx_error)?;

        Ok((rows.into_iter().map(Into::into).collect(), total))
    }

    async fn update(&self, user: &User) -> AppResult<User> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            UPDATE users
            SET
                email = $2,
                phone = $3,
                nickname = $4,
                avatar_url = $5,
                gender = $6,
                status = $7,
                bio = $8,
                updated_at = $9
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING
                id,
                username,
                email,
                phone,
                password_hash,
                nickname,
                avatar_url,
                gender,
                status,
                bio,
                last_login_at,
                last_login_ip,
                created_at,
                updated_at,
                deleted_at
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.phone)
        .bind(&user.nickname)
        .bind(&user.avatar_url)
        .bind(user.gender)
        .bind(user.status)
        .bind(&user.bio)
        .bind(user.updated_at)
        .fetch_one(self.pool.pool())
        .await
        .map_err(|err| match err {
            sqlx::Error::RowNotFound => {
                AppError::not_found_here(format!("user not found: {}", user.id))
            }
            other => Self::map_sqlx_error(other),
        })?;

        Ok(row.into())
    }

    async fn soft_delete(&self, id: i64) -> AppResult<()> {
        let now = Utc::now();

        let result = sqlx::query(
            r#"
            UPDATE users
            SET
                deleted_at = $2,
                updated_at = $2
            WHERE id = $1
              AND deleted_at IS NULL
            "#,
        )
        .bind(id)
        .bind(now)
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        if result.rows_affected() == 0 {
            return Err(AppError::not_found_here(format!("user not found: {}", id)));
        }

        Ok(())
    }

    async fn soft_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let now = Utc::now();

        sqlx::query(
            r#"
            UPDATE users
            SET
                deleted_at = $2,
                updated_at = $2
            WHERE id = ANY($1)
              AND deleted_at IS NULL
            "#,
        )
        .bind(ids)
        .bind(now)
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn hard_delete(&self, id: i64) -> AppResult<()> {
        let ids = [id];

        let result = sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = ANY($1)
            "#,
        )
        .bind(&ids[..])
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        if result.rows_affected() == 0 {
            return Err(AppError::not_found_here(format!("user not found: {}", id)));
        }

        Ok(())
    }

    async fn hard_delete_batch(&self, ids: &[i64]) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = ANY($1)
            "#,
        )
        .bind(ids)
        .execute(self.pool.pool())
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }
}
