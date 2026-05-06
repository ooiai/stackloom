use domain_base::{
    CreateRoleCmd, PageRoleCmd, UpdateRoleCmd,
    role::{ChildrenRoleCmd, RemoveCascadeRoleCmd, TreeRoleCmd},
};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateRoleReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub status: i16,
    pub is_builtin: bool,
    pub sort: i32,
}

impl From<CreateRoleReq> for CreateRoleCmd {
    fn from(req: CreateRoleReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            code: req.code,
            name: req.name,
            description: req.description,
            status: req.status,
            is_builtin: req.is_builtin,
            sort: req.sort,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetRoleReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateRoleReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<i16>,
    pub is_builtin: Option<bool>,
    pub sort: Option<i32>,
}

impl From<UpdateRoleReq> for UpdateRoleCmd {
    fn from(req: UpdateRoleReq) -> Self {
        Self {
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            code: req.code,
            name: req.name,
            description: req.description,
            status: req.status,
            is_builtin: req.is_builtin,
            sort: req.sort,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageRoleReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<PageRoleReq> for PageRoleCmd {
    fn from(req: PageRoleReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct TreeRoleReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub is_builtin: Option<bool>,
}

impl From<TreeRoleReq> for TreeRoleCmd {
    fn from(req: TreeRoleReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            is_builtin: req.is_builtin,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct ChildrenRoleReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
    pub is_builtin: Option<bool>,
}

impl From<ChildrenRoleReq> for ChildrenRoleCmd {
    fn from(req: ChildrenRoleReq) -> Self {
        Self {
            parent_id: req.parent_id,
            keyword: req.keyword,
            status: req.status,
            is_builtin: req.is_builtin,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteRoleReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct RemoveCascadeRoleReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<RemoveCascadeRoleReq> for RemoveCascadeRoleCmd {
    fn from(req: RemoveCascadeRoleReq) -> Self {
        Self { id: req.id }
    }
}
