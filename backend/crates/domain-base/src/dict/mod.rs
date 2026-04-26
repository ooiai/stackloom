pub mod repo;
pub mod service;

pub use repo::DictRepository;
pub use service::DictService;

use chrono::{DateTime, Utc};

use neocrates::response::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Dict {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub dict_type: String,
    pub dict_key: String,
    pub dict_value: String,
    pub label: String,
    pub value_type: String,
    pub description: Option<String>,
    pub sort: i32,
    pub status: i16,
    pub is_builtin: bool,
    pub is_leaf: bool,
    pub ext: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl Dict {
    pub fn new(cmd: CreateDictCmd) -> AppResult<Self> {
        cmd.validate()?;

        let now = Utc::now();

        Ok(Self {
            id: cmd.id,
            tenant_id: cmd.tenant_id,
            parent_id: cmd.parent_id,
            dict_type: cmd.dict_type,
            dict_key: cmd.dict_key,
            dict_value: cmd.dict_value,
            label: cmd.label,
            value_type: cmd.value_type,
            description: cmd.description,
            sort: cmd.sort,
            status: cmd.status,
            is_builtin: cmd.is_builtin,
            is_leaf: cmd.is_leaf,
            ext: cmd.ext,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        })
    }

    pub fn apply_update(&mut self, cmd: UpdateDictCmd) -> AppResult<()> {
        cmd.validate()?;

        if let Some(tenant_id) = cmd.tenant_id {
            self.tenant_id = Some(tenant_id);
        }

        if let Some(parent_id) = cmd.parent_id {
            self.parent_id = Some(parent_id);
        }

        if let Some(dict_type) = cmd.dict_type {
            self.dict_type = dict_type;
        }

        if let Some(dict_key) = cmd.dict_key {
            self.dict_key = dict_key;
        }

        if let Some(dict_value) = cmd.dict_value {
            self.dict_value = dict_value;
        }

        if let Some(label) = cmd.label {
            self.label = label;
        }

        if let Some(value_type) = cmd.value_type {
            self.value_type = value_type;
        }

        if let Some(description) = cmd.description {
            self.description = Some(description);
        }

        if let Some(sort) = cmd.sort {
            self.sort = sort;
        }

        if let Some(status) = cmd.status {
            self.status = status;
        }

        if let Some(is_builtin) = cmd.is_builtin {
            self.is_builtin = is_builtin;
        }

        if let Some(is_leaf) = cmd.is_leaf {
            self.is_leaf = is_leaf;
        }

        if let Some(ext) = cmd.ext {
            self.ext = ext;
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
        if self.dict_type.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_type cannot be empty".to_string(),
            ));
        }

        if self.dict_key.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_key cannot be empty".to_string(),
            ));
        }

        if self.dict_value.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_value cannot be empty".to_string(),
            ));
        }

        if self.label.trim().is_empty() {
            return Err(AppError::ValidationError(
                "label cannot be empty".to_string(),
            ));
        }

        if self.value_type.trim().is_empty() {
            return Err(AppError::ValidationError(
                "value_type cannot be empty".to_string(),
            ));
        }

        Ok(())
    }

    pub fn matches_keyword(&self, keyword: &str) -> bool {
        let keyword = keyword.trim().to_lowercase();
        if keyword.is_empty() {
            return true;
        }

        self.dict_type.to_lowercase().contains(&keyword)
            || self.dict_key.to_lowercase().contains(&keyword)
            || self.dict_value.to_lowercase().contains(&keyword)
            || self.label.to_lowercase().contains(&keyword)
            || self.value_type.to_lowercase().contains(&keyword)
            || self
                .description
                .as_deref()
                .unwrap_or_default()
                .to_lowercase()
                .contains(&keyword)
    }
}

#[derive(Debug, Clone)]
pub struct CreateDictCmd {
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub dict_type: String,
    pub dict_key: String,
    pub dict_value: String,
    pub label: String,
    pub value_type: String,
    pub description: Option<String>,
    pub sort: i32,
    pub status: i16,
    pub is_builtin: bool,
    pub is_leaf: bool,
    pub ext: String,
}

impl CreateDictCmd {
    pub fn validate(&self) -> AppResult<()> {
        if self.dict_type.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_type cannot be empty".to_string(),
            ));
        }

        if self.dict_key.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_key cannot be empty".to_string(),
            ));
        }

        if self.dict_value.trim().is_empty() {
            return Err(AppError::ValidationError(
                "dict_value cannot be empty".to_string(),
            ));
        }

        if self.label.trim().is_empty() {
            return Err(AppError::ValidationError(
                "label cannot be empty".to_string(),
            ));
        }

        if self.value_type.trim().is_empty() {
            return Err(AppError::ValidationError(
                "value_type cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default)]
pub struct UpdateDictCmd {
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub dict_type: Option<String>,
    pub dict_key: Option<String>,
    pub dict_value: Option<String>,
    pub label: Option<String>,
    pub value_type: Option<String>,
    pub description: Option<String>,
    pub sort: Option<i32>,
    pub status: Option<i16>,
    pub is_builtin: Option<bool>,
    pub is_leaf: Option<bool>,
    pub ext: Option<String>,
}

impl UpdateDictCmd {
    pub fn validate(&self) -> AppResult<()> {
        if let Some(value) = self.dict_type.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "dict_type cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.dict_key.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "dict_key cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.dict_value.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "dict_value cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.label.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "label cannot be empty".to_string(),
                ));
            }
        }

        if let Some(value) = self.value_type.as_ref() {
            if value.trim().is_empty() {
                return Err(AppError::ValidationError(
                    "value_type cannot be empty".to_string(),
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
pub struct PageDictCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct TreeDictCmd {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct ChildrenDictCmd {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

#[derive(Debug, Clone)]
pub struct RemoveCascadeDictCmd {
    pub id: i64,
}

#[derive(Debug, Clone, Default)]
pub struct DictPageQuery {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Default)]
pub struct DictTreeQuery {
    pub status: Option<i16>,
}

#[derive(Debug, Clone, Default)]
pub struct DictChildrenQuery {
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}
