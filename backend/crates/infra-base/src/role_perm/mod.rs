pub mod repo;
pub mod service;

pub use repo::SqlxRolePermRepository;
pub use service::RolePermServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::RolePerm;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct RolePermRow {
    pub id: i64,
    pub role_id: i64,
    pub perm_id: i64,
    pub created_at: DateTime<Utc>,
}

impl From<RolePermRow> for RolePerm {
    fn from(row: RolePermRow) -> Self {
        Self {
            id: row.id,
            role_id: row.role_id,
            perm_id: row.perm_id,
            created_at: row.created_at,
        }
    }
}
