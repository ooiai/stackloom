use std::collections::HashMap;

use domain_base::Dict;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct DictResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
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
}

impl From<Dict> for DictResp {
    fn from(dict: Dict) -> Self {
        Self {
            id: dict.id,
            tenant_id: dict.tenant_id,
            parent_id: dict.parent_id,
            dict_type: dict.dict_type,
            dict_key: dict.dict_key,
            dict_value: dict.dict_value,
            label: dict.label,
            value_type: dict.value_type,
            description: dict.description,
            sort: dict.sort,
            status: dict.status,
            is_builtin: dict.is_builtin,
            is_leaf: dict.is_leaf,
            ext: dict.ext,
            created_at: dict.created_at,
            updated_at: dict.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DictTreeNodeResp {
    #[serde(flatten)]
    pub dict: DictResp,
    pub children: Vec<DictTreeNodeResp>,
}

impl DictTreeNodeResp {
    pub fn from_flat(items: Vec<Dict>) -> Vec<Self> {
        let mut items_by_parent = HashMap::<Option<i64>, Vec<Dict>>::new();
        for item in items {
            items_by_parent
                .entry(item.parent_id)
                .or_default()
                .push(item);
        }

        fn build_branch(
            parent_id: Option<i64>,
            items_by_parent: &mut HashMap<Option<i64>, Vec<Dict>>,
        ) -> Vec<DictTreeNodeResp> {
            let nodes = items_by_parent.remove(&parent_id).unwrap_or_default();

            nodes
                .into_iter()
                .map(|dict| {
                    let id = dict.id;
                    DictTreeNodeResp {
                        dict: DictResp::from(dict),
                        children: build_branch(Some(id), items_by_parent),
                    }
                })
                .collect()
        }

        build_branch(None, &mut items_by_parent)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateDictResp {
    pub items: Vec<DictResp>,
    pub total: usize,
}

impl PaginateDictResp {
    pub fn new(items: Vec<DictResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DictTreeResp {
    pub items: Vec<DictTreeNodeResp>,
}

impl DictTreeResp {
    pub fn new(items: Vec<DictTreeNodeResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DictChildrenResp {
    pub items: Vec<DictResp>,
}

impl DictChildrenResp {
    pub fn new(items: Vec<DictResp>) -> Self {
        Self { items }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteDictResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteDictResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
