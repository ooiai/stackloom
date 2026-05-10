use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use common::core::biz_error::PERM_CODE_EXISTS;
use domain_base::{
    CreatePermCmd, PagePermCmd, Perm, PermRepository, PermService, UpdatePermCmd,
    perm::{
        ChildrenPermCmd, PermChildrenQuery, PermPageQuery, PermParentUpdate, PermTreeQuery,
        RemoveCascadePermCmd, TreePermCmd,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxPermRepository;

#[derive(Clone)]
pub struct PermServiceImpl<R>
where
    R: PermRepository,
{
    repository: Arc<R>,
}

impl PermServiceImpl<SqlxPermRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxPermRepository::new(pool)),
        }
    }
}

impl<R> PermServiceImpl<R>
where
    R: PermRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> PermService for PermServiceImpl<R>
where
    R: PermRepository,
{
    async fn create(&self, mut cmd: CreatePermCmd) -> AppResult<Perm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if self.repository.find_by_code(&cmd.code).await?.is_some() {
            return Err(AppError::DataError(
                PERM_CODE_EXISTS,
                "perm code already exists".to_string(),
            ));
        }

        if let Some(parent_id) = cmd.parent_id {
            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("perm parent not found: {parent_id}"))
                })?;
        }

        cmd.id = generate_sonyflake_id() as i64;

        let perm = Perm::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&perm).await
    }

    async fn get(&self, id: i64) -> AppResult<Perm> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))
    }

    async fn page(&self, cmd: PagePermCmd) -> AppResult<(Vec<Perm>, i64)> {
        let query = PermPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn tree(&self, cmd: TreePermCmd) -> AppResult<Vec<Perm>> {
        let perms = self
            .repository
            .list_for_tree(&PermTreeQuery { status: cmd.status })
            .await?;

        let keyword = cmd.keyword.unwrap_or_default();
        let trimmed = keyword.trim();
        if trimmed.is_empty() {
            return Ok(perms);
        }

        let parent_by_id = perms
            .iter()
            .map(|perm| (perm.id, perm.parent_id))
            .collect::<HashMap<_, _>>();

        let mut included_ids = HashSet::new();
        for perm in &perms {
            if !perm.matches_keyword(trimmed) {
                continue;
            }

            let mut current_id = Some(perm.id);
            while let Some(id) = current_id {
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        Ok(perms
            .into_iter()
            .filter(|perm| included_ids.contains(&perm.id))
            .collect())
    }

    async fn children(&self, cmd: ChildrenPermCmd) -> AppResult<Vec<Perm>> {
        self.repository
            .list_by_parent(&PermChildrenQuery {
                parent_id: cmd.parent_id,
                keyword: cmd.keyword,
                status: cmd.status,
            })
            .await
    }

    async fn update(&self, id: i64, cmd: UpdatePermCmd) -> AppResult<Perm> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(code) = cmd.code.as_ref() {
            if let Some(existing) = self.repository.find_by_code(code).await? {
                if existing.id != id {
                    return Err(AppError::DataError(
                        PERM_CODE_EXISTS,
                        "perm code already exists".to_string(),
                    ));
                }
            }
        }

        if let PermParentUpdate::Parent(parent_id) = &cmd.parent_id {
            let parent_id = *parent_id;
            if parent_id == id {
                return Err(AppError::ValidationError(
                    "perm cannot set itself as parent".to_string(),
                ));
            }

            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("perm parent not found: {parent_id}"))
                })?;

            let descendants = self.repository.find_descendant_ids(id).await?;
            if descendants.contains(&parent_id) {
                return Err(AppError::ValidationError(
                    "perm parent cannot be a descendant".to_string(),
                ));
            }
        }

        let mut perm = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))?;

        perm.apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&perm).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("perm not found: {id}")))?;

            let child_count = self.repository.count_by_parent_id(*id).await?;
            if child_count > 0 {
                return Err(AppError::ValidationError(format!(
                    "perm still has {child_count} children: {id}"
                )));
            }
        }

        self.repository.hard_delete_batch(&ids).await
    }

    async fn remove_cascade(&self, cmd: RemoveCascadePermCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("perm not found: {}", cmd.id)))?;

        let descendant_ids = self.repository.find_descendant_ids(cmd.id).await?;
        if descendant_ids.is_empty() {
            return Ok(());
        }

        self.repository.hard_delete_batch(&descendant_ids).await
    }
}
