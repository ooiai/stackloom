pub mod handlers;

use super::BaseHttpState;
use domain_base::{CreateUserCmd, PageUserCmd, UpdateUserCmd, User};
pub use handlers::{UsersState, create, delete, page, update};
use neocrates::{
    axum::{Router, routing::post},
    chrono::{DateTime, Utc},
    serde::{Deserialize, Serialize},
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
            id: 0,
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
pub struct UpdateUserReq {
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

#[derive(Debug, Clone, Serialize)]
pub struct UserResp {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: i16,
    pub status: i16,
    pub bio: Option<String>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub last_login_ip: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserResp {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            gender: user.gender,
            status: user.status,
            bio: user.bio,
            last_login_at: user.last_login_at,
            last_login_ip: user.last_login_ip,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateUserResp {
    pub items: Vec<UserResp>,
    pub total: usize,
}

impl PaginateUserResp {
    pub fn new(items: Vec<UserResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteUserResp {
    pub success: bool,
    pub id: i64,
}

impl DeleteUserResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}

pub fn router(state: BaseHttpState) -> Router {
    Router::new()
        .route("/create", post(create))
        .route("/update", post(update))
        .route("/page", post(page))
        .route("/remove", post(delete))
        .with_state(state)
}
