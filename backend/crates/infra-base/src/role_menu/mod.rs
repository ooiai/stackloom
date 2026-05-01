pub mod repo;
pub mod service;

pub use repo::SqlxRoleMenuRepository;
pub use service::RoleMenuServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::RoleMenu;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct RoleMenuRow {
    pub id: i64,
    pub role_id: i64,
    pub menu_id: i64,
    pub created_at: DateTime<Utc>,
}

impl From<RoleMenuRow> for RoleMenu {
    fn from(row: RoleMenuRow) -> Self {
        Self {
            id: row.id,
            role_id: row.role_id,
            menu_id: row.menu_id,
            created_at: row.created_at,
        }
    }
}
