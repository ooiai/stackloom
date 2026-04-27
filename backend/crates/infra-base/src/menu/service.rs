use std::sync::Arc;

use domain_base::{
    Menu,
    MenuRepository,
    MenuService,
    CreateMenuCmd,
    PageMenuCmd,
    UpdateMenuCmd,
    menu::MenuPageQuery,
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxMenuRepository;

#[derive(Clone)]
pub struct MenuServiceImpl<R>
where
    R: MenuRepository,
{
    repository: Arc<R>,
}

impl MenuServiceImpl<SqlxMenuRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxMenuRepository::new(pool)),
        }
    }
}

impl<R> MenuServiceImpl<R>
where
    R: MenuRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> MenuService for MenuServiceImpl<R>
where
    R: MenuRepository,
{
    async fn create(&self, mut cmd: CreateMenuCmd) -> AppResult<Menu> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        cmd.id = generate_sonyflake_id() as i64;

        let menu = Menu::new(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&menu).await
    }

    async fn get(&self, id: i64) -> AppResult<Menu> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("menu not found: {id}")))
    }

    async fn page(&self, cmd: PageMenuCmd) -> AppResult<(Vec<Menu>, i64)> {
        let query = MenuPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn update(&self, id: i64, cmd: UpdateMenuCmd) -> AppResult<Menu> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut menu = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("menu not found: {id}")))?;

        menu
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&menu).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("menu not found: {id}")))?;
        }

        self.repository.hard_delete_batch(&ids).await
    }
}
