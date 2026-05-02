use domain_base::Role;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct RoleResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub status: i16,
    pub is_builtin: bool,
    pub sort: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Role> for RoleResp {
    fn from(role: Role) -> Self {
        Self {
            id: role.id,
            tenant_id: role.tenant_id,
            code: role.code,
            name: role.name,
            description: role.description,
            status: role.status,
            is_builtin: role.is_builtin,
            sort: role.sort,
            created_at: role.created_at,
            updated_at: role.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateRoleResp {
    pub items: Vec<RoleResp>,
    pub total: usize,
}

impl PaginateRoleResp {
    pub fn new(items: Vec<RoleResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteRoleResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteRoleResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
