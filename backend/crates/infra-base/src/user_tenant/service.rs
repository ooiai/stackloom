use std::sync::Arc;

use domain_base::{
    CreateUserTenantCmd, PageTenantMemberCmd, PageUserTenantCmd, TenantMemberView,
    UpdateUserTenantCmd, UserTenant, UserTenantRepository, UserTenantService,
    user_tenant::{TenantMemberPageQuery, UserTenantPageQuery},
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxUserTenantRepository;

#[derive(Clone)]
pub struct UserTenantServiceImpl<R>
where
    R: UserTenantRepository,
{
    repository: Arc<R>,
}

impl UserTenantServiceImpl<SqlxUserTenantRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxUserTenantRepository::new(pool)),
        }
    }
}

impl<R> UserTenantServiceImpl<R>
where
    R: UserTenantRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> UserTenantService for UserTenantServiceImpl<R>
where
    R: UserTenantRepository,
{
    async fn create(&self, mut cmd: CreateUserTenantCmd) -> AppResult<UserTenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let user_tenant =
            UserTenant::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&user_tenant).await
    }

    async fn get(&self, id: i64) -> AppResult<UserTenant> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user_tenant not found: {id}")))
    }

    async fn page(&self, cmd: PageUserTenantCmd) -> AppResult<(Vec<UserTenant>, i64)> {
        let query = UserTenantPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateUserTenantCmd) -> AppResult<UserTenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut user_tenant = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user_tenant not found: {id}")))?;

        user_tenant
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&user_tenant).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("user_tenant not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }

    async fn find_by_user_and_tenant(
        &self,
        user_id: i64,
        tenant_id: i64,
    ) -> AppResult<Option<UserTenant>> {
        self.repository
            .find_by_user_and_tenant(user_id, tenant_id)
            .await
    }

    async fn page_members(
        &self,
        cmd: PageTenantMemberCmd,
    ) -> AppResult<(Vec<TenantMemberView>, i64)> {
        let query = TenantMemberPageQuery {
            tenant_id: cmd.tenant_id,
            keyword: cmd.keyword,
            limit: cmd.limit,
            offset: cmd.offset,
        };
        self.repository.page_members_by_tenant(&query).await
    }
}
