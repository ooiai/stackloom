use std::{
    collections::{BTreeSet, HashMap, HashSet},
    sync::Arc,
};

use common::core::{biz_error::MENU_CODE_EXISTS, constants::CACHE_MENUS_TREE_BY_CODE_RID};
use domain_base::{
    CreateMenuCmd, Menu, MenuRepository, MenuService, PageMenuCmd, UpdateMenuCmd,
    menu::{
        ChildrenMenuCmd, MenuChildrenQuery, MenuPageQuery, MenuTreeQuery, RemoveCascadeMenuCmd,
        TreeByCodeMenuCmd, TreeMenuCmd,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    serde_json,
    sqlxhelper::pool::SqlxPool,
    tracing,
};

use super::{MenuRow, repo::SqlxMenuRepository};

#[derive(Clone)]
pub struct MenuServiceImpl<R>
where
    R: MenuRepository,
{
    repository: Arc<R>,
    redis_pool: Arc<RedisPool>,
    key_prefix: String,
}

impl MenuServiceImpl<SqlxMenuRepository> {
    pub fn new(pool: Arc<SqlxPool>, redis_pool: Arc<RedisPool>, key_prefix: String) -> Self {
        Self {
            repository: Arc::new(SqlxMenuRepository::new(pool)),
            redis_pool,
            key_prefix,
        }
    }
}

impl<R> MenuServiceImpl<R>
where
    R: MenuRepository,
{
    pub fn with_repository(
        repository: Arc<R>,
        redis_pool: Arc<RedisPool>,
        key_prefix: String,
    ) -> Self {
        Self {
            repository,
            redis_pool,
            key_prefix,
        }
    }

    fn tree_cache_global_prefix(&self) -> String {
        format!("{}{}", self.key_prefix, CACHE_MENUS_TREE_BY_CODE_RID)
    }

    fn tree_cache_role_prefix(&self, role_id: i64) -> String {
        format!(
            "{}{}{}",
            self.key_prefix, CACHE_MENUS_TREE_BY_CODE_RID, role_id
        )
    }

    fn tree_cache_key(&self, role_id: i64, code: &str) -> String {
        format!("{}:code:{}", self.tree_cache_role_prefix(role_id), code)
    }

    async fn invalidate_tree_cache_prefix(&self, prefix: &str, scope: &str) {
        if let Err(e) = self.redis_pool.del_prefix(prefix).await {
            tracing::warn!(
                prefix = %prefix,
                scope,
                error = %e,
                "failed to invalidate tree_by_code cache prefix"
            );
        }
    }

    async fn invalidate_all_tree_cache(&self) {
        let prefix = self.tree_cache_global_prefix();
        self.invalidate_tree_cache_prefix(&prefix, "global").await;
    }

    async fn load_role_tree_by_code_cached(
        &self,
        role_id: i64,
        code: &str,
        status: Option<i16>,
    ) -> AppResult<Vec<Menu>> {
        let cache_key = self.tree_cache_key(role_id, code);
        match self.redis_pool.get::<_, String>(&cache_key).await {
            Ok(Some(json)) => match serde_json::from_str::<Vec<MenuRow>>(&json) {
                Ok(rows) => {
                    return Ok(rows.into_iter().map(Into::into).collect());
                }
                Err(e) => {
                    tracing::warn!(
                        role_id = %role_id,
                        code,
                        error = %e,
                        "tree_by_code cache decode failed, falling back to db"
                    );
                }
            },
            Ok(None) => {}
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    code,
                    error = %e,
                    "tree_by_code cache read failed, falling back to db"
                );
            }
        }

        let menus = self.compute_tree_by_code(code, status, &[role_id]).await?;
        let cache_rows = menus.iter().cloned().map(MenuRow::from).collect::<Vec<_>>();
        match serde_json::to_string(&cache_rows) {
            Ok(json) => {
                if let Err(e) = self.redis_pool.set(&cache_key, json).await {
                    tracing::warn!(
                        role_id = %role_id,
                        code,
                        error = %e,
                        "tree_by_code cache write failed after db fallback"
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    code,
                    error = %e,
                    "tree_by_code cache serialization failed"
                );
            }
        }

        Ok(menus)
    }

    async fn compute_tree_by_code(
        &self,
        code: &str,
        status: Option<i16>,
        role_ids: &[i64],
    ) -> AppResult<Vec<Menu>> {
        if role_ids.is_empty() {
            return Ok(Vec::new());
        }

        let all_menus = self
            .repository
            .list_for_tree(&MenuTreeQuery { status })
            .await?;
        let granted_menu_ids = self
            .repository
            .list_menu_ids_by_role_ids(role_ids)
            .await?
            .into_iter()
            .collect::<HashSet<_>>();

        let root_id = all_menus
            .iter()
            .find(|m| m.code == code)
            .ok_or_else(|| {
                AppError::not_found_here(format!("menu with code '{}' not found", code))
            })?
            .id;

        let children_by_parent: HashMap<i64, Vec<i64>> = all_menus
            .iter()
            .filter_map(|m| m.parent_id.map(|pid| (pid, m.id)))
            .fold(HashMap::new(), |mut map, (pid, id)| {
                map.entry(pid).or_default().push(id);
                map
            });
        let parent_by_id = all_menus
            .iter()
            .map(|menu| (menu.id, menu.parent_id))
            .collect::<HashMap<_, _>>();

        let mut subtree_ids = HashSet::new();
        let mut queue = vec![root_id];
        while let Some(id) = queue.pop() {
            if subtree_ids.insert(id) {
                if let Some(children) = children_by_parent.get(&id) {
                    queue.extend_from_slice(children);
                }
            }
        }

        let mut included_ids = HashSet::new();
        for menu_id in granted_menu_ids {
            if !subtree_ids.contains(&menu_id) {
                continue;
            }

            let mut current_id = Some(menu_id);
            while let Some(id) = current_id {
                if !subtree_ids.contains(&id) {
                    break;
                }
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        if included_ids.is_empty() {
            return Ok(Vec::new());
        }

        let mut menus: Vec<Menu> = all_menus
            .into_iter()
            .filter(|m| included_ids.contains(&m.id))
            .collect();

        if let Some(root) = menus.iter_mut().find(|m| m.id == root_id) {
            root.parent_id = None;
        }

        Ok(menus)
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
            return Err(AppError::DataError(
                MENU_CODE_EXISTS,
                "menu code already exists".to_string(),
            ));
        }

        if let Some(parent_id) = cmd.parent_id {
            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("menu parent not found: {parent_id}"))
                })?;
        }

        cmd.id = generate_sonyflake_id() as i64;

        let menu = Menu::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        let created = self.repository.create(&menu).await?;
        self.invalidate_all_tree_cache().await;
        Ok(created)
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
                    return Err(AppError::DataError(
                        MENU_CODE_EXISTS,
                        "menu code already exists".to_string(),
                    ));
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
                .ok_or_else(|| {
                    AppError::not_found_here(format!("menu parent not found: {parent_id}"))
                })?;

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

        let updated = self.repository.update(&menu).await?;
        self.invalidate_all_tree_cache().await;
        Ok(updated)
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

        self.repository.hard_delete_batch(&ids).await?;
        self.invalidate_all_tree_cache().await;
        Ok(())
    }

    async fn tree_by_code(&self, cmd: TreeByCodeMenuCmd) -> AppResult<Vec<Menu>> {
        if cmd.role_ids.is_empty() {
            return Ok(Vec::new());
        }

        let mut seen_menu_ids = HashSet::new();
        let mut menus = Vec::new();
        for role_id in cmd.role_ids.iter().copied().collect::<BTreeSet<_>>() {
            for menu in self
                .load_role_tree_by_code_cached(role_id, &cmd.code, cmd.status)
                .await?
            {
                if seen_menu_ids.insert(menu.id) {
                    menus.push(menu);
                }
            }
        }

        Ok(menus)
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

        self.repository.hard_delete_batch(&descendant_ids).await?;
        self.invalidate_all_tree_cache().await;
        Ok(())
    }
}
