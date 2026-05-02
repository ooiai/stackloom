pub mod repo;
pub mod service;

pub use repo::SqlxRoleRepository;
pub use service::RoleServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::Role;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct RoleRow {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub status: i16,
    pub is_builtin: bool,
    pub sort: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl From<RoleRow> for Role {
    fn from(row: RoleRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            code: row.code,
            name: row.name,
            description: row.description,
            status: row.status,
            is_builtin: row.is_builtin,
            sort: row.sort,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}
