use std::{
    collections::{BTreeSet, HashMap, HashSet},
    sync::Arc,
};

use common::core::{biz_error::ROLE_CODE_EXISTS, constants::CACHE_MENUS_TREE_BY_CODE_RID};
use domain_base::{
    CreateRoleCmd, PageRoleCmd, Role, RoleCodeService, RoleRepository, RoleService, UpdateRoleCmd,
    role::{
        AssignRoleMenusCmd, AssignRolePermsCmd, ChildrenRoleCmd, RemoveCascadeRoleCmd,
        RoleChildrenQuery, RolePageQuery, RoleTreeQuery, TreeRoleCmd,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    middlewares::models::{CACHE_MENUS_RID, CACHE_PERMS, CACHE_PERMS_RID},
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    serde_json,
    sqlxhelper::pool::SqlxPool,
    tracing,
};

use super::repo::SqlxRoleRepository;

#[derive(Clone)]
pub struct RoleServiceImpl<R>
where
    R: RoleRepository,
{
    repository: Arc<R>,
    redis_pool: Arc<RedisPool>,
    key_prefix: String,
}

impl RoleServiceImpl<SqlxRoleRepository> {
    pub fn new(pool: Arc<SqlxPool>, redis_pool: Arc<RedisPool>, key_prefix: String) -> Self {
        Self {
            repository: Arc::new(SqlxRoleRepository::new(pool)),
            redis_pool,
            key_prefix,
        }
    }
}

impl<R> RoleServiceImpl<R>
where
    R: RoleRepository,
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

    fn menu_cache_key(&self, role_id: i64) -> String {
        format!("{}{}{}", self.key_prefix, CACHE_MENUS_RID, role_id)
    }

    fn perm_cache_key(&self, role_id: i64) -> String {
        format!("{}{}{}", self.key_prefix, CACHE_PERMS_RID, role_id)
    }

    fn perm_action_cache_key(&self, role_id: i64) -> String {
        format!("{}{}{}", self.key_prefix, CACHE_PERMS, role_id)
    }

    fn tree_cache_role_prefix(&self, role_id: i64) -> String {
        format!(
            "{}{}{}",
            self.key_prefix, CACHE_MENUS_TREE_BY_CODE_RID, role_id
        )
    }

    async fn cache_menu_codes(
        &self,
        role_id: i64,
        codes: &[String],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let json = serde_json::to_string(codes)?;
        self.redis_pool
            .set(self.menu_cache_key(role_id), json)
            .await
    }

    async fn cache_perm_codes(
        &self,
        role_id: i64,
        codes: &[String],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let json = serde_json::to_string(codes)?;
        self.redis_pool
            .set(self.perm_cache_key(role_id), json)
            .await
    }

    async fn cache_perm_actions(
        &self,
        role_id: i64,
        actions: &[String],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let json = serde_json::to_string(actions)?;
        self.redis_pool
            .set(self.perm_action_cache_key(role_id), json)
            .await
    }

    async fn load_role_menu_codes_cached(&self, role_id: i64) -> AppResult<Vec<String>> {
        let cache_key = self.menu_cache_key(role_id);
        match self.redis_pool.get::<_, String>(&cache_key).await {
            Ok(Some(json)) => match serde_json::from_str::<Vec<String>>(&json) {
                Ok(codes) => return Ok(codes),
                Err(e) => {
                    tracing::warn!(
                        role_id = %role_id,
                        error = %e,
                        "role menu cache decode failed, falling back to db"
                    );
                }
            },
            Ok(None) => {}
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "role menu cache read failed, falling back to db"
                );
            }
        }

        let codes = self.repository.get_role_menu_codes(role_id).await?;
        if let Err(e) = self.cache_menu_codes(role_id, &codes).await {
            tracing::warn!(
                role_id = %role_id,
                error = %e,
                "role menu cache write failed after db fallback"
            );
        }

        Ok(codes)
    }

    async fn load_role_perm_codes_cached(&self, role_id: i64) -> AppResult<Vec<String>> {
        let cache_key = self.perm_cache_key(role_id);
        match self.redis_pool.get::<_, String>(&cache_key).await {
            Ok(Some(json)) => match serde_json::from_str::<Vec<String>>(&json) {
                Ok(codes) => return Ok(codes),
                Err(e) => {
                    tracing::warn!(
                        role_id = %role_id,
                        error = %e,
                        "role perm cache decode failed, falling back to db"
                    );
                }
            },
            Ok(None) => {}
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "role perm cache read failed, falling back to db"
                );
            }
        }

        let codes = self.repository.get_role_perm_codes(role_id).await?;
        if let Err(e) = self.cache_perm_codes(role_id, &codes).await {
            tracing::warn!(
                role_id = %role_id,
                error = %e,
                "role perm cache write failed after db fallback"
            );
        }

        Ok(codes)
    }

    async fn refresh_role_menu_codes_cache(&self, role_id: i64) {
        match self.repository.get_role_menu_codes(role_id).await {
            Ok(codes) => {
                if let Err(e) = self.cache_menu_codes(role_id, &codes).await {
                    tracing::warn!(
                        role_id = %role_id,
                        error = %e,
                        "assign_menus: failed to update menu cache"
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "assign_menus: failed to query menu codes for cache"
                );
            }
        }
    }

    async fn refresh_role_perm_codes_cache(&self, role_id: i64) {
        match self.repository.get_role_perm_codes(role_id).await {
            Ok(codes) => {
                if let Err(e) = self.cache_perm_codes(role_id, &codes).await {
                    tracing::warn!(
                        role_id = %role_id,
                        error = %e,
                        "assign_perms: failed to update perm cache"
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "assign_perms: failed to query perm codes for cache"
                );
            }
        }
    }

    async fn refresh_role_perm_actions_cache(&self, role_id: i64) {
        match self.repository.get_role_perm_actions(role_id).await {
            Ok(actions) => {
                if let Err(e) = self.cache_perm_actions(role_id, &actions).await {
                    tracing::warn!(
                        role_id = %role_id,
                        error = %e,
                        "assign_perms: failed to update perm action cache"
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "assign_perms: failed to query perm actions for cache"
                );
            }
        }
    }

    async fn invalidate_role_assignment_cache(&self, role_ids: &[i64]) {
        let unique_role_ids = role_ids.iter().copied().collect::<BTreeSet<_>>();
        for role_id in unique_role_ids {
            for (cache_key, cache_name) in [
                (self.menu_cache_key(role_id), "menu"),
                (self.perm_cache_key(role_id), "perm"),
                (self.perm_action_cache_key(role_id), "perm_action"),
            ] {
                if let Err(e) = self.redis_pool.del(&cache_key).await {
                    tracing::warn!(
                        role_id = %role_id,
                        cache = cache_name,
                        error = %e,
                        "failed to invalidate role code cache"
                    );
                }
            }
        }
    }

    async fn invalidate_role_tree_cache(&self, role_ids: &[i64]) {
        let unique_role_ids = role_ids.iter().copied().collect::<BTreeSet<_>>();
        for role_id in unique_role_ids {
            let prefix = self.tree_cache_role_prefix(role_id);
            if let Err(e) = self.redis_pool.del_prefix(&prefix).await {
                tracing::warn!(
                    role_id = %role_id,
                    error = %e,
                    "failed to invalidate role tree_by_code cache"
                );
            }
        }
    }
}

#[async_trait]
impl<R> RoleService for RoleServiceImpl<R>
where
    R: RoleRepository,
{
    async fn create(&self, mut cmd: CreateRoleCmd) -> AppResult<Role> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if self.repository.find_by_code(&cmd.code).await?.is_some() {
            return Err(AppError::DataError(
                ROLE_CODE_EXISTS,
                "role code already exists".to_string(),
            ));
        }

        if let Some(parent_id) = cmd.parent_id {
            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("role parent not found: {parent_id}"))
                })?;
        }

        cmd.id = generate_sonyflake_id() as i64;

        let role = Role::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&role).await
    }

    async fn get(&self, id: i64) -> AppResult<Role> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))
    }

    async fn page(&self, cmd: PageRoleCmd) -> AppResult<(Vec<Role>, i64)> {
        let query = RolePageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn tree(&self, cmd: TreeRoleCmd) -> AppResult<Vec<Role>> {
        let roles = self
            .repository
            .list_for_tree(&RoleTreeQuery {
                status: cmd.status,
                is_builtin: cmd.is_builtin,
            })
            .await?;

        let keyword = cmd.keyword.unwrap_or_default();
        let trimmed = keyword.trim();
        if trimmed.is_empty() {
            return Ok(roles);
        }

        let parent_by_id = roles
            .iter()
            .map(|role| (role.id, role.parent_id))
            .collect::<HashMap<_, _>>();

        let mut included_ids = HashSet::new();
        for role in &roles {
            if !role.matches_keyword(trimmed) {
                continue;
            }

            let mut current_id = Some(role.id);
            while let Some(id) = current_id {
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        Ok(roles
            .into_iter()
            .filter(|role| included_ids.contains(&role.id))
            .collect())
    }

    async fn children(&self, cmd: ChildrenRoleCmd) -> AppResult<Vec<Role>> {
        self.repository
            .list_by_parent(&RoleChildrenQuery {
                parent_id: cmd.parent_id,
                keyword: cmd.keyword,
                status: cmd.status,
                is_builtin: cmd.is_builtin,
            })
            .await
    }

    async fn update(&self, id: i64, cmd: UpdateRoleCmd) -> AppResult<Role> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(code) = cmd.code.as_ref() {
            if let Some(existing) = self.repository.find_by_code(code).await? {
                if existing.id != id {
                    return Err(AppError::DataError(
                        ROLE_CODE_EXISTS,
                        "role code already exists".to_string(),
                    ));
                }
            }
        }

        if let Some(parent_id) = cmd.parent_id {
            if parent_id == id {
                return Err(AppError::ValidationError(
                    "role cannot set itself as parent".to_string(),
                ));
            }

            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("role parent not found: {parent_id}"))
                })?;

            let descendants = self.repository.find_descendant_ids(id).await?;
            if descendants.contains(&parent_id) {
                return Err(AppError::ValidationError(
                    "role parent cannot be a descendant".to_string(),
                ));
            }
        }

        let mut role = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))?;

        role.apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&role).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("role not found: {id}")))?;

            let child_count = self.repository.count_by_parent_id(*id).await?;
            if child_count > 0 {
                return Err(AppError::ValidationError(format!(
                    "role still has {child_count} children: {id}"
                )));
            }
        }

        self.repository.hard_delete_batch(&ids).await?;
        self.invalidate_role_assignment_cache(&ids).await;
        self.invalidate_role_tree_cache(&ids).await;
        Ok(())
    }

    async fn remove_cascade(&self, cmd: RemoveCascadeRoleCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("role not found: {}", cmd.id)))?;

        let descendant_ids = self.repository.find_descendant_ids(cmd.id).await?;
        if descendant_ids.is_empty() {
            return Ok(());
        }

        self.repository.hard_delete_batch(&descendant_ids).await?;
        self.invalidate_role_assignment_cache(&descendant_ids).await;
        self.invalidate_role_tree_cache(&descendant_ids).await;
        Ok(())
    }

    async fn list_for_tenant(&self, tenant_id: i64) -> AppResult<Vec<Role>> {
        self.repository.list_for_tenant(tenant_id).await
    }

    async fn get_role_menus(&self, role_id: i64) -> AppResult<Vec<i64>> {
        self.repository.get_role_menus(role_id).await
    }

    async fn get_role_menu_codes(&self, role_id: i64) -> AppResult<Vec<String>> {
        self.repository.get_role_menu_codes(role_id).await
    }

    async fn assign_menus(&self, cmd: AssignRoleMenusCmd) -> AppResult<()> {
        cmd.validate()?;
        self.repository
            .replace_role_menus(cmd.role_id, &cmd.menu_ids)
            .await?;
        self.refresh_role_menu_codes_cache(cmd.role_id).await;
        self.invalidate_role_tree_cache(&[cmd.role_id]).await;
        Ok(())
    }

    async fn get_role_perms(&self, role_id: i64) -> AppResult<Vec<i64>> {
        self.repository.get_role_perms(role_id).await
    }

    async fn get_role_perm_codes(&self, role_id: i64) -> AppResult<Vec<String>> {
        self.repository.get_role_perm_codes(role_id).await
    }

    async fn assign_perms(&self, cmd: AssignRolePermsCmd) -> AppResult<()> {
        cmd.validate()?;
        self.repository
            .replace_role_perms(cmd.role_id, &cmd.perm_ids)
            .await?;
        self.refresh_role_perm_codes_cache(cmd.role_id).await;
        self.refresh_role_perm_actions_cache(cmd.role_id).await;
        Ok(())
    }

    async fn warm_perm_action_caches(&self) {
        match self.repository.list_all_ids().await {
            Ok(ids) => {
                tracing::info!(count = ids.len(), "warming perm action cache for all roles");
                for role_id in ids {
                    self.refresh_role_perm_actions_cache(role_id).await;
                }
            }
            Err(e) => {
                tracing::warn!(error = %e, "warm_perm_action_caches: failed to list role ids");
            }
        }
    }
}

#[async_trait]
impl<R> RoleCodeService for RoleServiceImpl<R>
where
    R: RoleRepository,
{
    async fn aggregate_menu_codes(&self, role_ids: &[i64]) -> AppResult<Vec<String>> {
        if role_ids.is_empty() {
            return Ok(Vec::new());
        }

        let mut merged_codes = BTreeSet::new();
        for role_id in role_ids.iter().copied().collect::<BTreeSet<_>>() {
            for code in self.load_role_menu_codes_cached(role_id).await? {
                merged_codes.insert(code);
            }
        }

        Ok(merged_codes.into_iter().collect())
    }

    async fn aggregate_perm_codes(&self, role_ids: &[i64]) -> AppResult<Vec<String>> {
        if role_ids.is_empty() {
            return Ok(Vec::new());
        }

        let mut merged_codes = BTreeSet::new();
        for role_id in role_ids.iter().copied().collect::<BTreeSet<_>>() {
            for code in self.load_role_perm_codes_cached(role_id).await? {
                merged_codes.insert(code);
            }
        }

        Ok(merged_codes.into_iter().collect())
    }
}
