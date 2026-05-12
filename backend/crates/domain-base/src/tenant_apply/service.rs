use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::tenant_apply::{
    ApproveTenantApplyCmd, BanTenantApplyCmd, PageTenantApplyCmd, RejectTenantApplyCmd,
    TenantApplyView,
};

#[async_trait]
pub trait TenantApplyService: Send + Sync {
    /// Return a page of self-service signup applications.
    async fn page(&self, cmd: PageTenantApplyCmd) -> AppResult<(Vec<TenantApplyView>, i64)>;

    /// Approve a pending application.
    async fn approve(&self, cmd: ApproveTenantApplyCmd) -> AppResult<()>;

    /// Reject a pending application.
    async fn reject(&self, cmd: RejectTenantApplyCmd) -> AppResult<()>;

    /// Ban a user and disable their application.
    async fn ban(&self, cmd: BanTenantApplyCmd) -> AppResult<()>;
}
