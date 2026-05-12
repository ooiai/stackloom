use crate::object_storage::{
    normalize_optional_nullable_object_ref, normalize_optional_object_ref,
};
use ::common::config::env_config::EnvConfig;
use domain_base::{
    CreateTenantCmd, PageTenantCmd, UpdateTenantCmd,
    tenant::{ChildrenTenantCmd, RemoveCascadeTenantCmd, TreeTenantCmd},
};
use domain_system::aws::ObjectStorageService;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    response::error::AppResult,
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
    pub logo_url: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl CreateTenantReq {
    pub fn normalize_logo_url(
        self,
        cfg: &EnvConfig,
        object_storage_service: &dyn ObjectStorageService,
    ) -> AppResult<Self> {
        let Self {
            parent_id,
            slug,
            name,
            description,
            owner_user_id,
            status,
            plan_code,
            logo_url,
            expired_at,
        } = self;

        Ok(Self {
            parent_id,
            slug,
            name,
            description,
            owner_user_id,
            status,
            plan_code,
            logo_url: normalize_optional_object_ref(
                cfg,
                object_storage_service,
                logo_url,
                "logo_url",
            )?,
            expired_at,
        })
    }
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
            logo_url: req.logo_url,
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
    #[serde(default)]
    pub logo_url: Option<Option<String>>,
    pub expired_at: Option<DateTime<Utc>>,
}

impl UpdateTenantReq {
    pub fn normalize_logo_url(
        self,
        cfg: &EnvConfig,
        object_storage_service: &dyn ObjectStorageService,
    ) -> AppResult<Self> {
        let Self {
            id,
            parent_id,
            slug,
            name,
            description,
            owner_user_id,
            status,
            plan_code,
            logo_url,
            expired_at,
        } = self;

        Ok(Self {
            id,
            parent_id,
            slug,
            name,
            description,
            owner_user_id,
            status,
            plan_code,
            logo_url: normalize_optional_nullable_object_ref(
                cfg,
                object_storage_service,
                logo_url,
                "logo_url",
            )?,
            expired_at,
        })
    }
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
            logo_url: req.logo_url,
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
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl From<ChildrenTenantReq> for ChildrenTenantCmd {
    fn from(req: ChildrenTenantReq) -> Self {
        Self {
            parent_id: req.parent_id,
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct TenantAncestorsReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
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
