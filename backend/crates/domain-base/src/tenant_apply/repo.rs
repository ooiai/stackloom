use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::tenant_apply::{
    ApproveTenantApplyCmd, BanTenantApplyCmd, PageTenantApplyCmd, RejectTenantApplyCmd,
    TenantApplyView,
};

#[async_trait]
pub trait TenantApplyRepository: Send + Sync {
    /// Return a page of self-service signup applications.
    async fn page(&self, cmd: &PageTenantApplyCmd) -> AppResult<(Vec<TenantApplyView>, i64)>;

    /// Find a single application by its `user_tenants.id`.
    async fn find_by_id(&self, id: i64) -> AppResult<Option<TenantApplyView>>;

    /// Approve: set `user_tenants.status = 1`.
    async fn approve(&self, cmd: &ApproveTenantApplyCmd) -> AppResult<()>;

    /// Reject: set `user_tenants.status = 0`.
    async fn reject(&self, cmd: &RejectTenantApplyCmd) -> AppResult<()>;

    /// Ban: set `users.status = 2` and `user_tenants.status = 0`.
    async fn ban(&self, cmd: &BanTenantApplyCmd) -> AppResult<()>;
}
