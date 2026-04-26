use domain_base::Tenant;
use neocrates::{
    chrono::{DateTime, Utc},
    helper::core::serde_helpers,
    serde::Serialize,
};

#[derive(Debug, Clone, Serialize)]
pub struct TenantResp {
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_user_id: Option<i64>,
    pub status: i16,
    pub plan_code: Option<String>,
    pub expired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Tenant> for TenantResp {
    fn from(tenant: Tenant) -> Self {
        Self {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            description: tenant.description,
            owner_user_id: tenant.owner_user_id,
            status: tenant.status,
            plan_code: tenant.plan_code,
            expired_at: tenant.expired_at,
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginateTenantResp {
    pub items: Vec<TenantResp>,
    pub total: usize,
}

impl PaginateTenantResp {
    pub fn new(items: Vec<TenantResp>, total: usize) -> Self {
        Self { items, total }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DeleteTenantResp {
    pub success: bool,
    #[serde(serialize_with = "serde_helpers::serialize_i64")]
    pub id: i64,
}

impl DeleteTenantResp {
    pub fn new(id: i64) -> Self {
        Self { success: true, id }
    }
}
