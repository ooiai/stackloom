pub mod repo;
pub mod service;

pub use repo::MenuRepository;
pub use service::MenuService;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Menu {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub path: Option<String>,
    pub component: Option<String>,
    pub redirect: Option<String>,
    pub icon: Option<String>,
    pub menu_type: i16,
    pub sort: i32,
    pub visible: bool,
    pub keep_alive: bool,
    pub status: i16,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl Menu {
    pub fn new(cmd: CreateMenuCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            parent_id: cmd.parent_id,
            code: cmd.code,
            name: cmd.name,
            description: cmd.description,
            path: cmd.path,
            component: cmd.component,
            redirect: cmd.redirect,
            icon: cmd.icon,
            menu_type: cmd.menu_type,
            sort: cmd.sort,
            visible: cmd.visible,
            keep_alive: cmd.keep_alive,
            status: cmd.status,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateMenuCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(tenant_id) = cmd.tenant_id {
            self.tenant_id = Some(tenant_id);
        }

        if let Some(parent_id) = cmd.parent_id {
            self.parent_id = Some(parent_id);
        }

        if let Some(code) = cmd.code {
            self.code = code;
        }

        if let Some(name) = cmd.name {
            self.name = name;
        }

        if let Some(path) = cmd.path {
            self.path = Some(path);
        }

        if let Some(component) = cmd.component {
            self.component = Some(component);
        }

        if let Some(redirect) = cmd.redirect {
            self.redirect = Some(redirect);
        }

        if let Some(icon) = cmd.icon {
            self.icon = Some(icon);
        }

        if let Some(description) = cmd.description {
            self.description = Some(description);
        }

        if let Some(menu_type) = cmd.menu_type {
            self.menu_type = menu_type;
        }

        if let Some(sort) = cmd.sort {
            self.sort = sort;
        }

        if let Some(visible) = cmd.visible {
            self.visible = visible;
        }

        if let Some(keep_alive) = cmd.keep_alive {
            self.keep_alive = keep_alive;
        }

        if let Some(status) = cmd.status {
            self.status = status;
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
        if self.code.trim().is_empty() {
            return Err(AppError::ValidationError(
                "code cannot be empty".to_string(),
            ));
        }

        if self.name.trim().is_empty() {
            return Err(AppError::ValidationError(
                "name cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct CreateMenuCmd {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub path: Option<String>,
    pub component: Option<String>,
    pub redirect: Option<String>,
    pub icon: Option<String>,
    pub menu_type: i16,
    pub sort: i32,
    pub visible: bool,
    pub keep_alive: bool,
    pub status: i16,
}

impl CreateMenuCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.code.trim().is_empty() {
            return Err(AppError::ValidationError(
                "code cannot be empty".to_string(),
            ));
        }

        if self.name.trim().is_empty() {
            return Err(AppError::ValidationError(
                "name cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateMenuCmd {
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub path: Option<String>,
    pub component: Option<String>,
    pub redirect: Option<String>,
    pub icon: Option<String>,
    pub menu_type: Option<i16>,
    pub sort: Option<i32>,
    pub visible: Option<bool>,
    pub keep_alive: Option<bool>,
    pub status: Option<i16>,
}

impl UpdateMenuCmd {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(value) = self.code.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "code cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.name.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "name cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.path.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "path cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.component.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "component cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.redirect.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "redirect cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.icon.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "icon cannot be empty".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageMenuCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct TreeMenuCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct ChildrenMenuCmd {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone)]
pub struct RemoveCascadeMenuCmd {
    pub id: i64,
}

#[derive(Debug, Clone, Default)]
pub struct MenuPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct MenuTreeQuery {
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct MenuChildrenQuery {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl Menu {
    pub fn matches_keyword(&self, keyword: &str) -> bool {
        let keyword = keyword.trim().to_lowercase();
        if keyword.is_empty() {
            return true;
        }

        self.code.to_lowercase().contains(&keyword)
            || self.name.to_lowercase().contains(&keyword)
            || self
                .path
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .component
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .redirect
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .icon
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
    }
}
