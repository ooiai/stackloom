use domain_base::Menu;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct MenuResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
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
}

impl From<Menu> for MenuResp {
    fn from(menu: Menu) -> Self {
        Self {
            id: menu.id,
            tenant_id: menu.tenant_id,
            parent_id: menu.parent_id,
            code: menu.code,
            name: menu.name,
            path: menu.path,
            component: menu.component,
            redirect: menu.redirect,
            icon: menu.icon,
            menu_type: menu.menu_type,
            sort: menu.sort,
            visible: menu.visible,
            keep_alive: menu.keep_alive,
            status: menu.status,
            created_at: menu.created_at,
            updated_at: menu.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateMenuResp {
    pub items: Vec<MenuResp>,
    pub total: usize,
}

impl PaginateMenuResp {
    pub fn new(items: Vec<MenuResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteMenuResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteMenuResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
