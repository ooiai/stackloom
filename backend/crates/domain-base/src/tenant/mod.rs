pub mod repo;
pub mod service;

pub use repo::TenantRepository;
pub use service::TenantService;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tenant {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl Tenant {
    pub fn new(cmd: CreateTenantCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            parent_id: cmd.parent_id,
            slug: cmd.slug,
            name: cmd.name,
            description: cmd.description,
            owner_user_id: cmd.owner_user_id,
            status: cmd.status,
            plan_code: cmd.plan_code,
            expired_at: cmd.expired_at,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateTenantCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(parent_id) = cmd.parent_id {
            self.parent_id = Some(parent_id);
        }

        if let Some(slug) = cmd.slug {
            self.slug = slug;
        }

        if let Some(name) = cmd.name {
            self.name = name;
        }

        if let Some(description) = cmd.description {
            self.description = Some(description);
        }

        if let Some(owner_user_id) = cmd.owner_user_id {
            self.owner_user_id = Some(owner_user_id);
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(plan_code) = cmd.plan_code {
            self.plan_code = Some(plan_code);
        }

        if let Some(expired_at) = cmd.expired_at {
            self.expired_at = Some(expired_at);
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
        if self.slug.trim().is_empty() {
            return Err(AppError::ValidationError(
                "slug cannot be empty".to_string(),
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
pub struct CreateTenantCmd {
    pub id: i64,
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl CreateTenantCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.slug.trim().is_empty() {
            return Err(AppError::ValidationError(
                "slug cannot be empty".to_string(),
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
pub struct UpdateTenantCmd {
    pub parent_id: Option<i64>,
    pub slug: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: Option<i16>,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl UpdateTenantCmd {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(value) = self.slug.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "slug cannot be empty".to_string(),
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

        if let Some(value) = self.description.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "description cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.plan_code.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "plan_code cannot be empty".to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct PageTenantCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct TreeTenantCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct ChildrenTenantCmd {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone)]
pub struct RemoveCascadeTenantCmd {
    pub id: i64,
}

#[derive(Debug, Clone, Default)]
pub struct TenantPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct TenantTreeQuery {
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct TenantChildrenQuery {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl Tenant {
    pub fn matches_keyword(&self, keyword: &str) -> bool {
        let keyword = keyword.trim().to_lowercase();
        if keyword.is_empty() {
            return true;
        }

        self.slug.to_lowercase().contains(&keyword)
            || self.name.to_lowercase().contains(&keyword)
            || self
                .description
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
            || self
                .plan_code
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
    }
}
