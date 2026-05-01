pub mod repo;
pub mod service;

pub use repo::RoleMenuRepository;
pub use service::RoleMenuService;

use chrono::{DateTime, Utc};

use neocrates::response::error::AppResult;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoleMenu {
    pub id: i64,
    pub role_id: i64,
    pub menu_id: i64,
    pub created_at: DateTime<Utc>,
}

impl RoleMenu {
    pub fn new(cmd: CreateRoleMenuCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            role_id: cmd.role_id,
            menu_id: cmd.menu_id,
            created_at: now,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateRoleMenuCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(role_id) = cmd.role_id {
            self.role_id = role_id;
        }

        if let Some(menu_id) = cmd.menu_id {
            self.menu_id = menu_id;
        }

        Ok(())
    }

    pub fn validate_required_fields(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct CreateRoleMenuCmd {
    pub id: i64,
    pub role_id: i64,
    pub menu_id: i64,
}

impl CreateRoleMenuCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateRoleMenuCmd {
    pub role_id: Option<i64>,
    pub menu_id: Option<i64>,
}

impl UpdateRoleMenuCmd {
    pub fn validate(&self) -> AppResult<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageRoleMenuCmd {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct RoleMenuPageQuery {
    pub keyword: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
