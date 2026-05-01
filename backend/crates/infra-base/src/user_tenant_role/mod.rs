pub mod repo;
pub mod service;

pub use repo::SqlxUserTenantRoleRepository;
pub use service::UserTenantRoleServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::UserTenantRole;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct UserTenantRoleRow {
    pub id: i64,
    pub user_tenant_id: i64,
    pub role_id: i64,
    pub created_at: DateTime<Utc>,
}

impl From<UserTenantRoleRow> for UserTenantRole {
    fn from(row: UserTenantRoleRow) -> Self {
        Self {
            id: row.id,
            user_tenant_id: row.user_tenant_id,
            role_id: row.role_id,
            created_at: row.created_at,
        }
    }
}
