use std::sync::Arc;

use chrono::Utc;
use common::core::{biz_error, constants::SIGNUP_MEMBER_CODE};
use domain_base::{
    CreateUserTenantCmd, MyTenantMembershipView, PageTenantMemberCmd, PageUserTenantCmd,
    RoleRepository, TenantMemberView, UpdateUserTenantCmd, UserTenant, UserTenantRepository,
    UserTenantService,
    user_tenant::{TenantMemberPageQuery, UserTenantPageQuery},
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use crate::SqlxRoleRepository;

use super::repo::SqlxUserTenantRepository;

#[derive(Clone)]
pub struct UserTenantServiceImpl<R, RR>
where
    R: UserTenantRepository,
    RR: RoleRepository,
{
    repository: Arc<R>,
    role_repository: Arc<RR>,
}

impl UserTenantServiceImpl<SqlxUserTenantRepository, SqlxRoleRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxUserTenantRepository::new(pool.clone())),
            role_repository: Arc::new(SqlxRoleRepository::new(pool)),
        }
    }
}

impl<R, RR> UserTenantServiceImpl<R, RR>
where
    R: UserTenantRepository,
    RR: RoleRepository,
{
    pub fn with_repository(repository: Arc<R>, role_repository: Arc<RR>) -> Self {
        Self {
            repository,
            role_repository,
        }
    }

    async fn load_member_role_id(&self) -> AppResult<i64> {
        self.role_repository
            .find_system_role_by_code(SIGNUP_MEMBER_CODE)
            .await?
            .map(|role| role.id)
            .ok_or_else(|| {
                AppError::not_found_here(format!(
                    "member role template not found: {SIGNUP_MEMBER_CODE}"
                ))
            })
    }
}

#[async_trait]
impl<R, RR> UserTenantService for UserTenantServiceImpl<R, RR>
where
    R: UserTenantRepository,
    RR: RoleRepository,
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

    async fn list_my_tenants(&self, user_id: i64) -> AppResult<Vec<MyTenantMembershipView>> {
        self.repository.list_my_tenants(user_id).await
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

    async fn update_member_status(
        &self,
        member_id: i64,
        requester_user_id: i64,
        tenant_id: i64,
        status: i16,
    ) -> AppResult<()> {
        if !matches!(status, 0 | 1) {
            return Err(AppError::ValidationError(
                "member status must be either 0 or 1".to_string(),
            ));
        }

        // Verify requester is a tenant admin.
        let requester = self
            .repository
            .find_by_user_and_tenant(requester_user_id, tenant_id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    biz_error::MEMBER_NOT_ADMIN,
                    format!("requester {requester_user_id} not in tenant {tenant_id}"),
                )
            })?;

        if !requester.is_tenant_admin {
            return Err(AppError::DataError(
                biz_error::MEMBER_NOT_ADMIN,
                format!("user {requester_user_id} is not a tenant admin"),
            ));
        }

        // Admins cannot change their own status.
        if requester.id == member_id {
            return Err(AppError::DataError(
                biz_error::MEMBER_CANNOT_CHANGE_SELF,
                "admin cannot change their own status".to_string(),
            ));
        }

        // Verify target member exists in this tenant.
        let target = self
            .repository
            .find_by_id(member_id)
            .await?
            .ok_or_else(|| {
                AppError::DataError(
                    biz_error::MEMBER_NOT_FOUND,
                    format!("member {member_id} not found"),
                )
            })?;

        if target.tenant_id != tenant_id {
            return Err(AppError::DataError(
                biz_error::MEMBER_NOT_FOUND,
                format!("member {member_id} does not belong to tenant {tenant_id}"),
            ));
        }

        match (target.status, status) {
            (2, 0) => {
                self.repository.soft_delete_batch(&[member_id]).await?;
                return Ok(());
            }
            (2, 1) | (0, 1) => {
                let member_role_id = self.load_member_role_id().await?;
                return self
                    .repository
                    .activate_with_role_if_missing(member_id, member_role_id)
                    .await;
            }
            (1, 0) => {}
            (current, next) if current == next => return Ok(()),
            _ => {
                return Err(AppError::ValidationError(format!(
                    "invalid member status transition: {} -> {}",
                    target.status, status
                )));
            }
        }

        self.repository.update_status(member_id, status).await
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

    async fn join_by_invite_code(
        &self,
        user_id: i64,
        tenant_id: i64,
        invited_by: Option<i64>,
    ) -> AppResult<UserTenant> {
        // Reject if already a member or a pending request already exists.
        if let Some(existing) = self
            .repository
            .find_by_user_and_tenant(user_id, tenant_id)
            .await?
        {
            let error_key = if existing.status == 2 {
                biz_error::INVITE_CODE_PENDING_APPROVAL
            } else {
                biz_error::INVITE_CODE_ALREADY_MEMBER
            };
            return Err(AppError::DataError(
                error_key,
                format!(
                    "user {user_id} already has membership state {} in tenant {tenant_id}",
                    existing.status
                ),
            ));
        }

        let id = generate_sonyflake_id() as i64;
        let now = Utc::now();
        let cmd = CreateUserTenantCmd {
            id,
            user_id,
            tenant_id,
            display_name: None,
            employee_no: None,
            job_title: None,
            status: 2,
            is_default: false,
            is_tenant_admin: false,
            joined_at: now,
            invited_by,
        };

        let user_tenant =
            UserTenant::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&user_tenant).await
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
