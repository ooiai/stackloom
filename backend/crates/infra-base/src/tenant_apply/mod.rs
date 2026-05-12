pub mod repo;
pub mod service;

pub use repo::SqlxTenantApplyRepository;
pub use service::TenantApplyServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::TenantApplyView;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct TenantApplyRow {
    pub id: i64,
    pub user_id: i64,
    pub tenant_id: i64,
    pub tenant_name: String,
    pub tenant_slug: String,
    pub applicant_username: String,
    pub applicant_name: Option<String>,
    pub applicant_phone: Option<String>,
    pub applicant_email: Option<String>,
    pub applicant_avatar: Option<String>,
    pub user_status: i16,
    pub membership_status: i16,
    pub created_at: DateTime<Utc>,
}

impl From<TenantApplyRow> for TenantApplyView {
    fn from(row: TenantApplyRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            tenant_id: row.tenant_id,
            tenant_name: row.tenant_name,
            tenant_slug: row.tenant_slug,
            applicant_username: row.applicant_username,
            applicant_name: row.applicant_name,
            applicant_phone: row.applicant_phone,
            applicant_email: row.applicant_email,
            applicant_avatar: row.applicant_avatar,
            user_status: row.user_status,
            membership_status: row.membership_status,
            created_at: row.created_at,
        }
    }
}
