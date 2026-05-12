pub mod repo;
pub mod service;

pub use repo::TenantApplyRepository;
pub use service::TenantApplyService;

use chrono::{DateTime, Utc};

/// A read-only view of a self-service signup application, composed by JOINing
/// `user_tenants`, `tenants`, and `users`.
#[derive(Debug, Clone)]
pub struct TenantApplyView {
    /// `user_tenants.id` — the primary key used for approve/reject/ban operations.
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
    /// `users.status`: 0=disabled, 1=active, 2=banned
    pub user_status: i16,
    /// `user_tenants.status`: 0=rejected/disabled, 1=active/approved, 2=pending
    pub membership_status: i16,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct PageTenantApplyCmd {
    pub keyword: Option<String>,
    /// Filter by membership status. None = all.
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct ApproveTenantApplyCmd {
    pub id: i64,
}

#[derive(Debug, Clone)]
pub struct RejectTenantApplyCmd {
    pub id: i64,
}

#[derive(Debug, Clone)]
pub struct BanTenantApplyCmd {
    pub id: i64,
}
