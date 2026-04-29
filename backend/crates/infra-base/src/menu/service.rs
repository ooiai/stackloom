use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use domain_base::{
    CreateMenuCmd, Menu, MenuRepository, MenuService, PageMenuCmd, UpdateMenuCmd,
    menu::{
        ChildrenMenuCmd, MenuChildrenQuery, MenuPageQuery, MenuTreeQuery, RemoveCascadeMenuCmd,
        TreeMenuCmd,
    },
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

        if self.repository.find_by_code(&cmd.code).await?.is_some() {
            return Err(AppError::Conflict("menu code already exists".to_string()));
        }

        if let Some(parent_id) = cmd.parent_id {
            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("menu parent not found: {parent_id}")))?;
        }

        cmd.id = generate_sonyflake_id() as i64;

        let menu = Menu::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

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

    async fn tree(&self, cmd: TreeMenuCmd) -> AppResult<Vec<Menu>> {
        let menus = self
            .repository
            .list_for_tree(&MenuTreeQuery { status: cmd.status })
            .await?;

        let keyword = cmd.keyword.unwrap_or_default();
        let trimmed = keyword.trim();
        if trimmed.is_empty() {
            return Ok(menus);
        }

        let parent_by_id = menus
            .iter()
            .map(|menu| (menu.id, menu.parent_id))
            .collect::<HashMap<_, _>>();

        let mut included_ids = HashSet::new();
        for menu in &menus {
            if !menu.matches_keyword(trimmed) {
                continue;
            }

            let mut current_id = Some(menu.id);
            while let Some(id) = current_id {
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        Ok(menus
            .into_iter()
            .filter(|menu| included_ids.contains(&menu.id))
            .collect())
    }

    async fn children(&self, cmd: ChildrenMenuCmd) -> AppResult<Vec<Menu>> {
        self.repository
            .list_by_parent(&MenuChildrenQuery {
                parent_id: cmd.parent_id,
                keyword: cmd.keyword,
                status: cmd.status,
            })
            .await
    }

    async fn update(&self, id: i64, cmd: UpdateMenuCmd) -> AppResult<Menu> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(code) = cmd.code.as_ref() {
            if let Some(existing) = self.repository.find_by_code(code).await? {
                if existing.id != id {
                    return Err(AppError::Conflict("menu code already exists".to_string()));
                }
            }
        }

        if let Some(parent_id) = cmd.parent_id {
            if parent_id == id {
                return Err(AppError::ValidationError(
                    "menu cannot set itself as parent".to_string(),
                ));
            }

            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("menu parent not found: {parent_id}")))?;

            let descendants = self.repository.find_descendant_ids(id).await?;
            if descendants.contains(&parent_id) {
                return Err(AppError::ValidationError(
                    "menu parent cannot be a descendant".to_string(),
                ));
            }
        }

        let mut menu = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("menu not found: {id}")))?;

        menu.apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&menu).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("menu not found: {id}")))?;

            let child_count = self.repository.count_by_parent_id(*id).await?;
            if child_count > 0 {
                return Err(AppError::ValidationError(format!(
                    "menu still has {child_count} children: {id}"
                )));
            }
        }

        self.repository.hard_delete_batch(&ids).await
    }

    async fn remove_cascade(&self, cmd: RemoveCascadeMenuCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("menu not found: {}", cmd.id)))?;

        let descendant_ids = self.repository.find_descendant_ids(cmd.id).await?;
        if descendant_ids.is_empty() {
            return Ok(());
        }

        self.repository.hard_delete_batch(&descendant_ids).await
    }
}
