use std::sync::Arc;

use domain_base::{
    RoleMenu,
    RoleMenuRepository,
    RoleMenuService,
    CreateRoleMenuCmd,
    PageRoleMenuCmd,
    UpdateRoleMenuCmd,
    role_menu::RoleMenuPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxRoleMenuRepository;

#[derive(Clone)]
pub struct RoleMenuServiceImpl<R>
where
    R: RoleMenuRepository,
{
    repository: Arc<R>,
}

impl RoleMenuServiceImpl<SqlxRoleMenuRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxRoleMenuRepository::new(pool)),
        }
    }
}

impl<R> RoleMenuServiceImpl<R>
where
    R: RoleMenuRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> RoleMenuService for RoleMenuServiceImpl<R>
where
    R: RoleMenuRepository,
{
    async fn create(&self, mut cmd: CreateRoleMenuCmd) -> AppResult<RoleMenu> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let role_menu = RoleMenu::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&role_menu).await
    }

    async fn get(&self, id: i64) -> AppResult<RoleMenu> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role_menu not found: {id}")))
    }

    async fn page(&self, cmd: PageRoleMenuCmd) -> AppResult<(Vec<RoleMenu>, i64)> {
        let query = RoleMenuPageQuery {
            keyword: cmd.keyword,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateRoleMenuCmd) -> AppResult<RoleMenu> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut role_menu = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role_menu not found: {id}")))?;

        role_menu
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&role_menu).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("role_menu not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
