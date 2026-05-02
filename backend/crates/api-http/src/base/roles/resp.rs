use std::collections::HashMap;

use domain_base::Role;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct RoleResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub status: i16,
    pub is_builtin: bool,
    pub sort: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct RoleTreeNodeResp {
    #[serde(flatten)]
    pub role: RoleResp,
    pub children: Vec<RoleTreeNodeResp>,
}

impl RoleTreeNodeResp {
    pub fn from_flat(items: Vec<Role>) -> Vec<Self> {
        let mut items_by_parent = HashMap::<Option<i64>, Vec<Role>>::new();
        for item in items {
            items_by_parent.entry(item.parent_id).or_default().push(item);
        }

        fn build_branch(
            parent_id: Option<i64>,
            items_by_parent: &mut HashMap<Option<i64>, Vec<Role>>,
        ) -> Vec<RoleTreeNodeResp> {
            let nodes = items_by_parent.remove(&parent_id).unwrap_or_default();

            nodes
                .into_iter()
                .map(|role| {
                    let id = role.id;
                    RoleTreeNodeResp {
                        role: RoleResp::from(role),
                        children: build_branch(Some(id), items_by_parent),
                    }
                })
                .collect()
        }

        build_branch(None, &mut items_by_parent)
    }
}

impl From<Role> for RoleResp {
    fn from(role: Role) -> Self {
        Self {
            id: role.id,
            tenant_id: role.tenant_id,
            parent_id: role.parent_id,
            code: role.code,
            name: role.name,
            description: role.description,
            status: role.status,
            is_builtin: role.is_builtin,
            sort: role.sort,
            created_at: role.created_at,
            updated_at: role.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateRoleResp {
    pub items: Vec<RoleResp>,
    pub total: usize,
}

impl PaginateRoleResp {
    pub fn new(items: Vec<RoleResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct RoleTreeResp {
    pub items: Vec<RoleTreeNodeResp>,
}

impl RoleTreeResp {
    pub fn new(items: Vec<RoleTreeNodeResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct RoleChildrenResp {
    pub items: Vec<RoleResp>,
}

impl RoleChildrenResp {
    pub fn new(items: Vec<RoleResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteRoleResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteRoleResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
