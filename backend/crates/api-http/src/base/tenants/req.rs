use domain_base::{CreateTenantCmd, PageTenantCmd, UpdateTenantCmd};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateTenantReq {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl From<CreateTenantReq> for CreateTenantCmd {
    fn from(req: CreateTenantReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            slug: req.slug,
            name: req.name,
            description: req.description,
            owner_user_id: req.owner_user_id,
            status: req.status,
            plan_code: req.plan_code,
            expired_at: req.expired_at,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetTenantReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateTenantReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    pub slug: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: Option<i16>,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl From<UpdateTenantReq> for UpdateTenantCmd {
    fn from(req: UpdateTenantReq) -> Self {
        Self {
            slug: req.slug,
            name: req.name,
            description: req.description,
            owner_user_id: req.owner_user_id,
            status: req.status,
            plan_code: req.plan_code,
            expired_at: req.expired_at,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageTenantReq {
    pub keyword: Option<String>,

    pub status: Option<i16>,

    pub limit: Option<i64>,

    pub offset: Option<i64>,
}

impl From<PageTenantReq> for PageTenantCmd {
    fn from(req: PageTenantReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteTenantReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
