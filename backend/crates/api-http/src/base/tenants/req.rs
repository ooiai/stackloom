use domain_base::{
    CreateTenantCmd, PageTenantCmd, UpdateTenantCmd,
    tenant::{ChildrenTenantCmd, RemoveCascadeTenantCmd, TreeTenantCmd},
};
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateTenantReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl From<CreateTenantReq> for CreateTenantCmd {
    fn from(req: CreateTenantReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            parent_id: req.parent_id,
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

    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub slug: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub owner_user_id: Option<i64>,
    pub status: Option<i16>,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl From<UpdateTenantReq> for UpdateTenantCmd {
    fn from(req: UpdateTenantReq) -> Self {
        Self {
            parent_id: req.parent_id,
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
pub struct TreeTenantReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<TreeTenantReq> for TreeTenantCmd {
    fn from(req: TreeTenantReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct ChildrenTenantReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<ChildrenTenantReq> for ChildrenTenantCmd {
    fn from(req: ChildrenTenantReq) -> Self {
        Self {
            parent_id: req.parent_id,
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteTenantReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct RemoveCascadeTenantReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<RemoveCascadeTenantReq> for RemoveCascadeTenantCmd {
    fn from(req: RemoveCascadeTenantReq) -> Self {
        Self { id: req.id }
    }
}
