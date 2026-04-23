use domain_base::User;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct UserResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
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
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteUserResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
