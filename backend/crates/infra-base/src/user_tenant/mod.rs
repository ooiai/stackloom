pub mod repo;
pub mod service;

pub use repo::SqlxUserTenantRepository;
pub use service::UserTenantServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::{TenantMemberView, UserTenant};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct UserTenantRow {
    pub id: i64,
    pub user_id: i64,
    pub tenant_id: i64,
    pub display_name: Option<String>,
    pub employee_no: Option<String>,
    pub job_title: Option<String>,
    pub status: i16,
    pub is_default: bool,
    pub is_tenant_admin: bool,
    pub joined_at: DateTime<Utc>,
    pub invited_by: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl From<UserTenantRow> for UserTenant {
    fn from(row: UserTenantRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            tenant_id: row.tenant_id,
            display_name: row.display_name,
            employee_no: row.employee_no,
            job_title: row.job_title,
            status: row.status,
            is_default: row.is_default,
            is_tenant_admin: row.is_tenant_admin,
            joined_at: row.joined_at,
            invited_by: row.invited_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}

/// Flat row from the user_tenants + users JOIN used by the web members endpoint.
#[derive(Debug, Clone, FromRow)]
pub struct TenantMemberViewRow {
    pub id: i64,
    pub user_id: i64,
    pub tenant_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub job_title: Option<String>,
    pub status: i16,
    pub is_tenant_admin: bool,
    pub joined_at: DateTime<Utc>,
}

impl From<TenantMemberViewRow> for TenantMemberView {
    fn from(row: TenantMemberViewRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            tenant_id: row.tenant_id,
            username: row.username,
            nickname: row.nickname,
            email: row.email,
            phone: row.phone,
            avatar_url: row.avatar_url,
            display_name: row.display_name,
            job_title: row.job_title,
            status: row.status,
            is_tenant_admin: row.is_tenant_admin,
            joined_at: row.joined_at,
        }
    }
}
