pub mod repo;
pub mod service;

pub use repo::SqlxMenuRepository;
pub use service::MenuServiceImpl;

use chrono::{DateTime, Utc};
use domain_base::Menu;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct MenuRow {
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

impl From<MenuRow> for Menu {
    fn from(row: MenuRow) -> Self {
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            parent_id: row.parent_id,
            code: row.code,
            name: row.name,
            description: row.description,
            path: row.path,
            component: row.component,
            redirect: row.redirect,
            icon: row.icon,
            menu_type: row.menu_type,
            sort: row.sort,
            visible: row.visible,
            keep_alive: row.keep_alive,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
        }
    }
}
