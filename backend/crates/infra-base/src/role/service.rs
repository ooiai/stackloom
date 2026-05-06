use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use common::core::biz_error::ROLE_CODE_EXISTS;
use domain_base::{
    CreateRoleCmd, PageRoleCmd, Role, RoleRepository, RoleService, UpdateRoleCmd,
    role::{
        ChildrenRoleCmd, RemoveCascadeRoleCmd, RoleChildrenQuery, RolePageQuery, RoleTreeQuery,
        TreeRoleCmd,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxRoleRepository;

#[derive(Clone)]
pub struct RoleServiceImpl<R>
where
    R: RoleRepository,
{
    repository: Arc<R>,
}

impl RoleServiceImpl<SqlxRoleRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxRoleRepository::new(pool)),
        }
    }
}

impl<R> RoleServiceImpl<R>
where
    R: RoleRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
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
            .list_for_tree(&RoleTreeQuery { status: cmd.status })
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

        self.repository.hard_delete_batch(&ids).await
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

        self.repository.hard_delete_batch(&descendant_ids).await
    }
}
