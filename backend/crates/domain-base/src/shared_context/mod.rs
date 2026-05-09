pub mod service;

pub use service::SharedContextService;

use crate::{UpdateUserCmd, UpdateUserTenantCmd};

#[derive(Debug, Clone)]
pub struct SharedHeaderUser {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub employee_no: Option<String>,
    pub job_title: Option<String>,
    pub tenant_name: String,
    pub tenant_id: i64,
}

#[derive(Debug, Clone)]
pub struct SharedHeaderContext {
    pub user: SharedHeaderUser,
    pub menu_codes: Vec<String>,
    pub perm_codes: Vec<String>,
    pub role_ids: Vec<i64>,
}

#[derive(Debug, Clone)]
pub struct UserProfileView {
    pub id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub employee_no: Option<String>,
    pub job_title: Option<String>,
    pub tenant_id: i64,
    pub tenant_name: String,
}

#[derive(Debug, Clone)]
pub struct UpdateProfileCmd {
    pub user: UpdateUserCmd,
    pub membership: UpdateUserTenantCmd,
}
