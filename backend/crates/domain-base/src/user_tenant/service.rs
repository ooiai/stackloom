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
    async fn page_members(
        &self,
        cmd: PageTenantMemberCmd,
    ) -> AppResult<(Vec<TenantMemberView>, i64)>;

    async fn update(&self, id: i64, cmd: UpdateUserTenantCmd) -> AppResult<UserTenant>;

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()>;

    /// Update the membership status of a tenant member.
    ///
    /// Only a tenant admin may call this. Admins cannot disable themselves.
    async fn update_member_status(
        &self,
        member_id: i64,
        requester_user_id: i64,
        tenant_id: i64,
        status: i16,
    ) -> AppResult<()>;

    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>>;

    /// Join a tenant via an invite code.
    ///
    /// Creates a new membership record for `user_id` in `tenant_id`.
    /// Returns `INVITE_CODE_ALREADY_MEMBER` if the user is already a member.
    async fn join_by_invite_code(
        &self,
        user_id: i64,
        tenant_id: i64,
        invited_by: Option<i64>,
    ) -> AppResult<()>;
}
