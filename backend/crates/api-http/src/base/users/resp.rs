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

/// A single role item returned by `get_roles`, including whether it is currently
/// assigned to the queried user's membership in the current tenant.
#[derive(Debug, Clone, Serialize)]
pub struct UserRoleItemResp {
    /// The role's ID.
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,

    /// `None` for system roles; the tenant's ID for tenant-scoped roles.
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub tenant_id: Option<i64>,

    /// Optional parent role ID for tree-aware display.
    #[serde(serialize_with = "serde_helpers::serialize_option_i64")]
    pub parent_id: Option<i64>,

    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub is_builtin: bool,
    pub sort: i32,

    /// `true` if this role is currently assigned to the user's membership.
    pub is_assigned: bool,
}

/// Response for `get_roles`.
#[derive(Debug, Clone, Serialize)]
pub struct UserRolesResp {
    pub items: Vec<UserRoleItemResp>,
}
