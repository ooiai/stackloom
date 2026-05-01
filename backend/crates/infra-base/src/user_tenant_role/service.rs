use std::sync::Arc;

use domain_base::{
    UserTenantRole,
    UserTenantRoleRepository,
    UserTenantRoleService,
    CreateUserTenantRoleCmd,
    PageUserTenantRoleCmd,
    UpdateUserTenantRoleCmd,
    user_tenant_role::UserTenantRolePageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxUserTenantRoleRepository;

#[derive(Clone)]
pub struct UserTenantRoleServiceImpl<R>
where
    R: UserTenantRoleRepository,
{
    repository: Arc<R>,
}

impl UserTenantRoleServiceImpl<SqlxUserTenantRoleRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxUserTenantRoleRepository::new(pool)),
        }
    }
}

impl<R> UserTenantRoleServiceImpl<R>
where
    R: UserTenantRoleRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> UserTenantRoleService for UserTenantRoleServiceImpl<R>
where
    R: UserTenantRoleRepository,
{
    async fn create(&self, mut cmd: CreateUserTenantRoleCmd) -> AppResult<UserTenantRole> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let user_tenant_role = UserTenantRole::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&user_tenant_role).await
    }

    async fn get(&self, id: i64) -> AppResult<UserTenantRole> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user_tenant_role not found: {id}")))
    }

    async fn page(&self, cmd: PageUserTenantRoleCmd) -> AppResult<(Vec<UserTenantRole>, i64)> {
        let query = UserTenantRolePageQuery {
            keyword: cmd.keyword,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateUserTenantRoleCmd) -> AppResult<UserTenantRole> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut user_tenant_role = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("user_tenant_role not found: {id}")))?;

        user_tenant_role
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&user_tenant_role).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("user_tenant_role not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
