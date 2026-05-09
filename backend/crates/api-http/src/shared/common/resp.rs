use std::collections::HashMap;

use domain_base::{Menu, Tenant};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct MenuResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
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
}

#[derive(Debug, Clone, Serialize)]
pub struct MenuTreeNodeResp {
    #[serde(flatten)]
    pub menu: MenuResp,
    pub children: Vec<MenuTreeNodeResp>,
}

impl MenuTreeNodeResp {
    pub fn from_flat(items: Vec<Menu>) -> Vec<Self> {
        let mut items_by_parent = HashMap::<Option<i64>, Vec<Menu>>::new();
        for item in items {
            items_by_parent
                .entry(item.parent_id)
                .or_default()
                .push(item);
        }

        fn build_branch(
            parent_id: Option<i64>,
            items_by_parent: &mut HashMap<Option<i64>, Vec<Menu>>,
        ) -> Vec<MenuTreeNodeResp> {
            let nodes = items_by_parent.remove(&parent_id).unwrap_or_default();

            nodes
                .into_iter()
                .map(|menu| {
                    let id = menu.id;
                    MenuTreeNodeResp {
                        menu: MenuResp::from(menu),
                        children: build_branch(Some(id), items_by_parent),
                    }
                })
                .collect()
        }

        build_branch(None, &mut items_by_parent)
    }
}

impl From<Menu> for MenuResp {
    fn from(menu: Menu) -> Self {
        Self {
            id: menu.id,
            tenant_id: menu.tenant_id,
            parent_id: menu.parent_id,
            code: menu.code,
            name: menu.name,
            description: menu.description,
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
pub struct MenuTreeResp {
    pub items: Vec<MenuTreeNodeResp>,
}

impl MenuTreeResp {
    pub fn new(items: Vec<MenuTreeNodeResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct HeaderContextUserResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub username: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub tenant_name: String,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub tenant_id: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct HeaderContextResp {
    pub user: HeaderContextUserResp,
    pub menu_codes: Vec<String>,
    pub perm_codes: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MyTenantResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub plan_code: Option<String>,
    pub is_default: bool,
    pub is_current: bool,
}

impl MyTenantResp {
    pub fn from_tenant_with_default(
        tenant: Tenant,
        is_default: bool,
        current_tenant_id: i64,
    ) -> Self {
        Self {
            is_current: tenant.id == current_tenant_id,
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan_code: tenant.plan_code,
            is_default,
        }
    }
}
