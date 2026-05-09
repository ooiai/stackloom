pub mod repo;
pub mod service;

pub use repo::UserTenantRepository;
pub use service::UserTenantService;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserTenant {
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

impl UserTenant {
    pub fn new(cmd: CreateUserTenantCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            user_id: cmd.user_id,
            tenant_id: cmd.tenant_id,
            display_name: cmd.display_name,
            employee_no: cmd.employee_no,
            job_title: cmd.job_title,
            status: cmd.status,
            is_default: cmd.is_default,
            is_tenant_admin: cmd.is_tenant_admin,
            joined_at: cmd.joined_at,
            invited_by: cmd.invited_by,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateUserTenantCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(user_id) = cmd.user_id {
            self.user_id = user_id;
        }

        if let Some(tenant_id) = cmd.tenant_id {
            self.tenant_id = tenant_id;
        }

        if let Some(display_name) = cmd.display_name {
            self.display_name = Some(display_name);
        }

        if let Some(employee_no) = cmd.employee_no {
            self.employee_no = Some(employee_no);
        }

        if let Some(job_title) = cmd.job_title {
            self.job_title = Some(job_title);
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(is_default) = cmd.is_default {
            self.is_default = is_default;
        }

        if let Some(is_tenant_admin) = cmd.is_tenant_admin {
            self.is_tenant_admin = is_tenant_admin;
        }

        if let Some(joined_at) = cmd.joined_at {
            self.joined_at = joined_at;
        }

        if let Some(invited_by) = cmd.invited_by {
            self.invited_by = Some(invited_by);
        }

        self.updated_at = Utc::now();
        Ok(())
    }

    pub fn mark_deleted(&mut self) {
        let now = Utc::now();
        self.deleted_at = Some(now);
        self.updated_at = now;
    }

    pub fn validate_required_fields(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct CreateUserTenantCmd {
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
}

impl CreateUserTenantCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateUserTenantCmd {
    pub user_id: Option<i64>,
    pub tenant_id: Option<i64>,
    pub display_name: Option<String>,
    pub employee_no: Option<String>,
    pub job_title: Option<String>,
    pub status: Option<i16>,
    pub is_default: Option<bool>,
    pub is_tenant_admin: Option<bool>,
    pub joined_at: Option<DateTime<Utc>>,
    pub invited_by: Option<i64>,
}

impl UpdateUserTenantCmd {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(value) = self.display_name.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "display_name cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.employee_no.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "employee_no cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.job_title.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "job_title cannot be empty".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageUserTenantCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct UserTenantPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Read-only view joining user_tenants with the users table.
/// Used for the web-facing member list endpoint.
#[derive(Debug, Clone)]
pub struct TenantMemberView {
    pub id: i64,
    pub user_id: i64,
    pub tenant_id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub display_name: Option<String>,
    pub job_title: Option<String>,
    pub status: i16,
    pub is_tenant_admin: bool,
    pub joined_at: DateTime<Utc>,
}

/// Command for paginating tenant members via the web API.
#[derive(Debug, Clone, Default)]
pub struct PageTenantMemberCmd {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Internal page query forwarded to the repository layer.
#[derive(Debug, Clone, Default)]
pub struct TenantMemberPageQuery {
    pub tenant_id: i64,
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
