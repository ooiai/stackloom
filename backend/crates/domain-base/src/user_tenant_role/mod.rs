pub mod repo;
pub mod service;

pub use repo::UserTenantRoleRepository;
pub use service::UserTenantRoleService;

use chrono::{DateTime, Utc};

use neocrates::response::error::AppResult;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserTenantRole {
    pub id: i64,
    pub user_tenant_id: i64,
    pub role_id: i64,
    pub created_at: DateTime<Utc>,
}

impl UserTenantRole {
    pub fn new(cmd: CreateUserTenantRoleCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            user_tenant_id: cmd.user_tenant_id,
            role_id: cmd.role_id,
            created_at: now,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateUserTenantRoleCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(user_tenant_id) = cmd.user_tenant_id {
            self.user_tenant_id = user_tenant_id;
        }

        if let Some(role_id) = cmd.role_id {
            self.role_id = role_id;
        }

        Ok(())
    }

    pub fn validate_required_fields(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct CreateUserTenantRoleCmd {
    pub id: i64,
    pub user_tenant_id: i64,
    pub role_id: i64,
}

impl CreateUserTenantRoleCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateUserTenantRoleCmd {
    pub user_tenant_id: Option<i64>,
    pub role_id: Option<i64>,
}

impl UpdateUserTenantRoleCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageUserTenantRoleCmd {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct UserTenantRolePageQuery {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
