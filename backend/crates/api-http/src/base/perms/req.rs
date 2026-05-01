use domain_base::{CreatePermCmd, PagePermCmd, UpdatePermCmd};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreatePermReq {
    pub tenant_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: i16,
}

impl From<CreatePermReq> for CreatePermCmd {
    fn from(req: CreatePermReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            tenant_id: req.tenant_id,
            code: req.code,
            name: req.name,
            resource: req.resource,
            action: req.action,
            description: req.description,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetPermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdatePermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    pub tenant_id: Option<i64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: Option<i16>,
}

impl From<UpdatePermReq> for UpdatePermCmd {
    fn from(req: UpdatePermReq) -> Self {
        Self {
            tenant_id: req.tenant_id,
            code: req.code,
            name: req.name,
            resource: req.resource,
            action: req.action,
            description: req.description,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PagePermReq {
    pub keyword: Option<String>,

    pub status: Option<i16>,

    pub limit: Option<i64>,

    pub offset: Option<i64>,
}

impl From<PagePermReq> for PagePermCmd {
    fn from(req: PagePermReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeletePermReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
