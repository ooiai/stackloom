use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{
    CreateUserTenantCmd, PageTenantMemberCmd, PageUserTenantCmd, TenantMemberView,
    UpdateUserTenantCmd, UserTenant,
};

#[async_trait]
pub trait UserTenantService: Send + Sync {
    async fn create(&self, cmd: CreateUserTenantCmd) -> AppResult<UserTenant>;

    async fn get(&self, id: i64) -> AppResult<UserTenant>;

    async fn page(&self, cmd: PageUserTenantCmd) -> AppResult<(Vec<UserTenant>, i64)>;

    /// Paginate members of a tenant with joined user data.
    async fn page_members(&self, cmd: PageTenantMemberCmd) -> AppResult<(Vec<TenantMemberView>, i64)>;

    async fn update(&self, id: i64, cmd: UpdateUserTenantCmd) -> AppResult<UserTenant>;

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;

    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>>;
}
