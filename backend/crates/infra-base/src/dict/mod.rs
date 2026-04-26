pub mod repo;
pub mod service;

pub use repo::SqlxDictRepository;
pub use service::DictServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::Dict;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct DictRow {
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

impl From<DictRow> for Dict {
    fn from(row: DictRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            parent_id: row.parent_id,
            dict_type: row.dict_type,
            dict_key: row.dict_key,
            dict_value: row.dict_value,
            label: row.label,
            value_type: row.value_type,
            description: row.description,
            sort: row.sort,
            status: row.status,
            is_builtin: row.is_builtin,
            is_leaf: row.is_leaf,
            ext: row.ext,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}
