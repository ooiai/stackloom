pub mod repo;
pub mod service;

pub use repo::RolePermRepository;
pub use service::RolePermService;

use chrono::{DateTime, Utc};

use neocrates::response::error::AppResult;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RolePerm {
    pub id: i64,
    pub role_id: i64,
    pub perm_id: i64,
    pub created_at: DateTime<Utc>,
}

impl RolePerm {
    pub fn new(cmd: CreateRolePermCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            role_id: cmd.role_id,
            perm_id: cmd.perm_id,
            created_at: now,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateRolePermCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(role_id) = cmd.role_id {
            self.role_id = role_id;
        }

        if let Some(perm_id) = cmd.perm_id {
            self.perm_id = perm_id;
        }

        Ok(())
    }

    pub fn validate_required_fields(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct CreateRolePermCmd {
    pub id: i64,
    pub role_id: i64,
    pub perm_id: i64,
}

impl CreateRolePermCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateRolePermCmd {
    pub role_id: Option<i64>,
    pub perm_id: Option<i64>,
}

impl UpdateRolePermCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageRolePermCmd {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct RolePermPageQuery {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
