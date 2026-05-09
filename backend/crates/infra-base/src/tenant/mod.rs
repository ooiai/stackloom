pub mod repo;
pub mod service;

pub use repo::SqlxTenantRepository;
pub use service::TenantServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::Tenant;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct TenantRow {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub has_children: bool,
}

impl From<TenantRow> for Tenant {
    fn from(row: TenantRow) -> Self {
        Self {
            id: row.id,
            parent_id: row.parent_id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            owner_user_id: row.owner_user_id,
            status: row.status,
            plan_code: row.plan_code,
            expired_at: row.expired_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            has_children: row.has_children,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct TenantWithDefaultRow {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub has_children: bool,
    pub is_default: bool,
}

impl From<TenantWithDefaultRow> for (Tenant, bool) {
    fn from(row: TenantWithDefaultRow) -> Self {
        let is_default = row.is_default;
        let tenant = Tenant {
            id: row.id,
            parent_id: row.parent_id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            owner_user_id: row.owner_user_id,
            status: row.status,
            plan_code: row.plan_code,
            expired_at: row.expired_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            has_children: row.has_children,
        };
        (tenant, is_default)
    }
}
