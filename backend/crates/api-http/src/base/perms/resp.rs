use domain_base::Perm;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct PermResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub tenant_id: Option<i64>,
    pub code: String,
    pub name: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub status: i16,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Perm> for PermResp {
    fn from(perm: Perm) -> Self {
        Self {
            id: perm.id,
            tenant_id: perm.tenant_id,
            code: perm.code,
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            status: perm.status,
            created_at: perm.created_at,
            updated_at: perm.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginatePermResp {
    pub items: Vec<PermResp>,
    pub total: usize,
}

impl PaginatePermResp {
    pub fn new(items: Vec<PermResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeletePermResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeletePermResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
