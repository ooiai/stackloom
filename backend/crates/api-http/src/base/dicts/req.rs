use domain_base::{CreateDictCmd, PageDictCmd, UpdateDictCmd};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateDictReq {
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

impl From<CreateDictReq> for CreateDictCmd {
    fn from(req: CreateDictReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            dict_type: req.dict_type,
            dict_key: req.dict_key,
            dict_value: req.dict_value,
            label: req.label,
            value_type: req.value_type,
            description: req.description,
            sort: req.sort,
            status: req.status,
            is_builtin: req.is_builtin,
            is_leaf: req.is_leaf,
            ext: req.ext,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetDictReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateDictReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

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

impl From<UpdateDictReq> for UpdateDictCmd {
    fn from(req: UpdateDictReq) -> Self {
        Self {
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            dict_type: req.dict_type,
            dict_key: req.dict_key,
            dict_value: req.dict_value,
            label: req.label,
            value_type: req.value_type,
            description: req.description,
            sort: req.sort,
            status: req.status,
            is_builtin: req.is_builtin,
            is_leaf: req.is_leaf,
            ext: req.ext,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageDictReq {
    pub keyword: Option<String>,

    pub status: Option<i16>,

    pub limit: Option<i64>,

    pub offset: Option<i64>,
}

impl From<PageDictReq> for PageDictCmd {
    fn from(req: PageDictReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteDictReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
