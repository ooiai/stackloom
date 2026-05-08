pub mod repo;
pub mod service;

pub use repo::SqlxPermRepository;
pub use service::PermServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::Perm;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct PermRow {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub method: Option<String>,
    pub description: Option<String>,
    pub status: i16,
    pub sort: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl From<PermRow> for Perm {
    fn from(row: PermRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            parent_id: row.parent_id,
            code: row.code,
            name: row.name,
            resource: row.resource,
            action: row.action,
            method: row.method,
            description: row.description,
            status: row.status,
            sort: row.sort,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}
