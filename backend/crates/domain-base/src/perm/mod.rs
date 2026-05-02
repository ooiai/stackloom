pub mod repo;
pub mod service;

pub use repo::PermRepository;
pub use service::PermService;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Perm {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: i16,
    pub sort: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl Perm {
    pub fn new(cmd: CreatePermCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            parent_id: cmd.parent_id,
            code: cmd.code,
            name: cmd.name,
            resource: cmd.resource,
            action: cmd.action,
            description: cmd.description,
            status: cmd.status,
            sort: cmd.sort,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdatePermCmd) -> AppResult<()> {
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

        if let Some(resource) = cmd.resource {
            self.resource = Some(resource);
        }

        if let Some(action) = cmd.action {
            self.action = Some(action);
        }

        if let Some(description) = cmd.description {
            self.description = Some(description);
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(sort) = cmd.sort {
            self.sort = sort;
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
pub struct CreatePermCmd {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: i16,
    pub sort: i32,
}

impl CreatePermCmd {
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
pub struct UpdatePermCmd {
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: Option<i16>,
    pub sort: Option<i32>,
}

impl UpdatePermCmd {
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

        if let Some(value) = self.resource.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "resource cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.action.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "action cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.description.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "description cannot be empty".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PagePermCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct TreePermCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct ChildrenPermCmd {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone)]
pub struct RemoveCascadePermCmd {
    pub id: i64,
}

#[derive(Debug, Clone, Default)]
pub struct PermPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct PermTreeQuery {
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct PermChildrenQuery {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl Perm {
    pub fn matches_keyword(&self, keyword: &str) -> bool {
        let keyword = keyword.trim().to_lowercase();
        if keyword.is_empty() {
            return true;
        }

        self.code.to_lowercase().contains(&keyword)
            || self.name.to_lowercase().contains(&keyword)
            || self
                .resource
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .action
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .description
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
    }
}
