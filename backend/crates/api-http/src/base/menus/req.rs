use domain_base::{
    CreateMenuCmd, PageMenuCmd, UpdateMenuCmd,
    menu::{ChildrenMenuCmd, RemoveCascadeMenuCmd, TreeByCodeMenuCmd, TreeMenuCmd},
};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateMenuReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub path: Option<String>,
    pub component: Option<String>,
    pub redirect: Option<String>,
    pub icon: Option<String>,
    pub menu_type: i16,
    pub sort: i32,
    pub visible: bool,
    pub keep_alive: bool,
    pub status: i16,
}

impl From<CreateMenuReq> for CreateMenuCmd {
    fn from(req: CreateMenuReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            code: req.code,
            name: req.name,
            description: req.description,
            path: req.path,
            component: req.component,
            redirect: req.redirect,
            icon: req.icon,
            menu_type: req.menu_type,
            sort: req.sort,
            visible: req.visible,
            keep_alive: req.keep_alive,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetMenuReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateMenuReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub tenant_id: Option<i64>,
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub path: Option<String>,
    pub component: Option<String>,
    pub redirect: Option<String>,
    pub icon: Option<String>,
    pub menu_type: Option<i16>,
    pub sort: Option<i32>,
    pub visible: Option<bool>,
    pub keep_alive: Option<bool>,
    pub status: Option<i16>,
}

impl From<UpdateMenuReq> for UpdateMenuCmd {
    fn from(req: UpdateMenuReq) -> Self {
        Self {
            tenant_id: req.tenant_id,
            parent_id: req.parent_id,
            code: req.code,
            name: req.name,
            description: req.description,
            path: req.path,
            component: req.component,
            redirect: req.redirect,
            icon: req.icon,
            menu_type: req.menu_type,
            sort: req.sort,
            visible: req.visible,
            keep_alive: req.keep_alive,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageMenuReq {
    pub keyword: Option<String>,

    pub status: Option<i16>,

    pub limit: Option<i64>,

    pub offset: Option<i64>,
}

impl From<PageMenuReq> for PageMenuCmd {
    fn from(req: PageMenuReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct TreeMenuReq {
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<TreeMenuReq> for TreeMenuCmd {
    fn from(req: TreeMenuReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct ChildrenMenuReq {
    #[serde(default, deserialize_with = "serde_helpers::deserialize_option_i64")]
    pub parent_id: Option<i64>,
    pub keyword: Option<String>,
    pub status: Option<i16>,
}

impl From<ChildrenMenuReq> for ChildrenMenuCmd {
    fn from(req: ChildrenMenuReq) -> Self {
        Self {
            parent_id: req.parent_id,
            keyword: req.keyword,
            status: req.status,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteMenuReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct RemoveCascadeMenuReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

impl From<RemoveCascadeMenuReq> for RemoveCascadeMenuCmd {
    fn from(req: RemoveCascadeMenuReq) -> Self {
        Self { id: req.id }
    }
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct TreeByCodeMenuReq {
    #[validate(length(min = 1, message = "code is required"))]
    pub code: String,
    pub status: Option<i16>,
}

impl From<TreeByCodeMenuReq> for TreeByCodeMenuCmd {
    fn from(req: TreeByCodeMenuReq) -> Self {
        Self {
            code: req.code,
            status: req.status,
        }
    }
}
