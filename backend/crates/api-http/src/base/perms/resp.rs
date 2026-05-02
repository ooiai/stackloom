use std::collections::HashMap;

use domain_base::Perm;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct PermResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
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
}

#[derive(Debug, Clone, Serialize)]
pub struct PermTreeNodeResp {
    #[serde(flatten)]
    pub perm: PermResp,
    pub children: Vec<PermTreeNodeResp>,
}

impl PermTreeNodeResp {
    pub fn from_flat(items: Vec<Perm>) -> Vec<Self> {
        let mut items_by_parent = HashMap::<Option<i64>, Vec<Perm>>::new();
        for item in items {
            items_by_parent.entry(item.parent_id).or_default().push(item);
        }

        fn build_branch(
            parent_id: Option<i64>,
            items_by_parent: &mut HashMap<Option<i64>, Vec<Perm>>,
        ) -> Vec<PermTreeNodeResp> {
            let nodes = items_by_parent.remove(&parent_id).unwrap_or_default();

            nodes
                .into_iter()
                .map(|perm| {
                    let id = perm.id;
                    PermTreeNodeResp {
                        perm: PermResp::from(perm),
                        children: build_branch(Some(id), items_by_parent),
                    }
                })
                .collect()
        }

        build_branch(None, &mut items_by_parent)
    }
}

impl From<Perm> for PermResp {
    fn from(perm: Perm) -> Self {
        Self {
            id: perm.id,
            tenant_id: perm.tenant_id,
            parent_id: perm.parent_id,
            code: perm.code,
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            status: perm.status,
            sort: perm.sort,
            created_at: perm.created_at,
            updated_at: perm.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginatePermResp {
    pub items: Vec<PermResp>,
    pub total: usize,
}

impl PaginatePermResp {
    pub fn new(items: Vec<PermResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PermTreeResp {
    pub items: Vec<PermTreeNodeResp>,
}

impl PermTreeResp {
    pub fn new(items: Vec<PermTreeNodeResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PermChildrenResp {
    pub items: Vec<PermResp>,
}

impl PermChildrenResp {
    pub fn new(items: Vec<PermResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeletePermResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeletePermResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
