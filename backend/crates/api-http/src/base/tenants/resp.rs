use std::collections::HashMap;

use domain_base::Tenant;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct TenantResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub has_children: bool,
}

impl From<Tenant> for TenantResp {
    fn from(tenant: Tenant) -> Self {
        Self {
            id: tenant.id,
            parent_id: tenant.parent_id,
            slug: tenant.slug,
            name: tenant.name,
            description: tenant.description,
            owner_user_id: tenant.owner_user_id,
            status: tenant.status,
            plan_code: tenant.plan_code,
            expired_at: tenant.expired_at,
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
            has_children: tenant.has_children,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct TenantTreeNodeResp {
    #[serde(flatten)]
    pub tenant: TenantResp,
    pub children: Vec<TenantTreeNodeResp>,
}

impl TenantTreeNodeResp {
    pub fn from_flat(items: Vec<Tenant>) -> Vec<Self> {
        let mut items_by_parent = HashMap::<Option<i64>, Vec<Tenant>>::new();
        for item in items {
            items_by_parent
                .entry(item.parent_id)
                .or_default()
                .push(item);
        }

        fn build_branch(
            parent_id: Option<i64>,
            items_by_parent: &mut HashMap<Option<i64>, Vec<Tenant>>,
        ) -> Vec<TenantTreeNodeResp> {
            let nodes = items_by_parent.remove(&parent_id).unwrap_or_default();

            nodes
                .into_iter()
                .map(|tenant| {
                    let id = tenant.id;
                    TenantTreeNodeResp {
                        tenant: TenantResp::from(tenant),
                        children: build_branch(Some(id), items_by_parent),
                    }
                })
                .collect()
        }

        build_branch(None, &mut items_by_parent)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateTenantResp {
    pub items: Vec<TenantResp>,
    pub total: usize,
}

impl PaginateTenantResp {
    pub fn new(items: Vec<TenantResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct TenantTreeResp {
    pub items: Vec<TenantTreeNodeResp>,
}

impl TenantTreeResp {
    pub fn new(items: Vec<TenantTreeNodeResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct TenantChildrenResp {
    pub items: Vec<TenantResp>,
    pub total: usize,
}

impl TenantChildrenResp {
    pub fn new(items: Vec<TenantResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct TenantAncestorsResp {
    pub items: Vec<TenantResp>,
}

impl TenantAncestorsResp {
    pub fn new(items: Vec<TenantResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteTenantResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteTenantResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
