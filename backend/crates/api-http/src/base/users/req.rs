use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd};
use neocrates::{
    helper::core::{serde_helpers, snowflake::generate_sonyflake_id},
    serde::Deserialize,
};
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CreateUserReq {
    #[validate(length(min = 1, max = 50))]
    pub username: String,

    #[validate(email)]
    pub email: Option<String>,

    #[validate(length(min = 1, max = 20))]
    pub phone: Option<String>,

    #[validate(length(min = 1))]
    pub password_hash: String,

    #[validate(length(max = 100))]
    pub nickname: Option<String>,

    #[validate(url)]
    pub avatar_url: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub gender: i16,

    #[validate(range(min = 0, max = 2))]
    pub status: i16,

    #[validate(length(max = 2000))]
    pub bio: Option<String>,
}

impl From<CreateUserReq> for CreateUserCmd {
    fn from(req: CreateUserReq) -> Self {
        Self {
            id: generate_sonyflake_id() as i64,
            username: req.username,
            email: req.email,
            phone: req.phone,
            password_hash: req.password_hash,
            nickname: req.nickname,
            avatar_url: req.avatar_url,
            gender: req.gender,
            status: req.status,
            bio: req.bio,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct GetUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct UpdateUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_i64")]
    pub id: i64,

    #[validate(email)]
    pub email: Option<String>,

    #[validate(length(min = 1, max = 20))]
    pub phone: Option<String>,

    #[validate(length(max = 100))]
    pub nickname: Option<String>,

    #[validate(url)]
    pub avatar_url: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub gender: Option<i16>,

    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,

    #[validate(length(max = 2000))]
    pub bio: Option<String>,
}

impl From<UpdateUserReq> for UpdateUserCmd {
    fn from(req: UpdateUserReq) -> Self {
        Self {
            email: req.email,
            phone: req.phone,
            nickname: req.nickname,
            avatar_url: req.avatar_url,
            gender: req.gender,
            status: req.status,
            bio: req.bio,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct PageUserReq {
    #[validate(length(max = 100))]
    pub keyword: Option<String>,

    #[validate(range(min = 0, max = 2))]
    pub status: Option<i16>,

    #[validate(range(min = 1, max = 100))]
    pub limit: Option<i64>,

    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

impl From<PageUserReq> for PageUserCmd {
    fn from(req: PageUserReq) -> Self {
        Self {
            keyword: req.keyword,
            status: req.status,
            limit: req.limit,
            offset: req.offset,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Validate, Default)]
pub struct DeleteUserReq {
    #[serde(deserialize_with = "serde_helpers::deserialize_vec_i64")]
    pub ids: Vec<i64>,
}
