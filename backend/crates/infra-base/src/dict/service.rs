use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use domain_base::{
    ChildrenDictCmd, CreateDictCmd, Dict, DictRepository, DictService, PageDictCmd,
    RemoveCascadeDictCmd, TreeDictCmd, UpdateDictCmd,
    dict::{DictChildrenQuery, DictPageQuery, DictTreeQuery},
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxDictRepository;

#[derive(Clone)]
pub struct DictServiceImpl<R>
where
    R: DictRepository,
{
    repository: Arc<R>,
}

impl DictServiceImpl<SqlxDictRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxDictRepository::new(pool)),
        }
    }
}

impl<R> DictServiceImpl<R>
where
    R: DictRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }

    async fn sync_parent_leaf_state(&self, parent_id: i64) -> AppResult<()> {
        let Some(mut parent) = self.repository.find_by_id(parent_id).await? else {
            return Ok(());
        };

        let has_children = self.repository.count_by_parent_id(parent_id).await? > 0;
        if parent.is_leaf == !has_children {
            return Ok(());
        }

        parent
            .apply_update(UpdateDictCmd {
                is_leaf: Some(!has_children),
                ..Default::default()
            })
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&parent).await?;

        Ok(())
    }
}

#[async_trait]
impl<R> DictService for DictServiceImpl<R>
where
    R: DictRepository,
{
    async fn create(&self, mut cmd: CreateDictCmd) -> AppResult<Dict> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let parent_id = cmd.parent_id;
        if let Some(id) = parent_id {
            let parent = self
                .repository
                .find_by_id(id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("dict parent not found: {id}")))?;

            cmd.dict_type = parent.dict_type;
        }

        cmd.id = generate_sonyflake_id() as i64;
        cmd.is_leaf = true;

        let dict = Dict::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        let created = self.repository.create(&dict).await?;

        if let Some(id) = parent_id {
            self.sync_parent_leaf_state(id).await?;
        }

        Ok(created)
    }

    async fn get(&self, id: i64) -> AppResult<Dict> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))
    }

    async fn page(&self, cmd: PageDictCmd) -> AppResult<(Vec<Dict>, i64)> {
        let query = DictPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn tree(&self, cmd: TreeDictCmd) -> AppResult<Vec<Dict>> {
        let dicts = self
            .repository
            .list_for_tree(&DictTreeQuery { status: cmd.status })
            .await?;

        let keyword = cmd.keyword.unwrap_or_default();
        let trimmed = keyword.trim();
        if trimmed.is_empty() {
            return Ok(dicts);
        }

        let parent_by_id = dicts
            .iter()
            .map(|dict| (dict.id, dict.parent_id))
            .collect::<HashMap<_, _>>();

        let mut included_ids = HashSet::new();
        for dict in &dicts {
            if !dict.matches_keyword(trimmed) {
                continue;
            }

            let mut current_id = Some(dict.id);
            while let Some(id) = current_id {
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        Ok(dicts
            .into_iter()
            .filter(|dict| included_ids.contains(&dict.id))
            .collect())
    }

    async fn children(&self, cmd: ChildrenDictCmd) -> AppResult<Vec<Dict>> {
        self.repository
            .list_by_parent(&DictChildrenQuery {
                parent_id: cmd.parent_id,
                keyword: cmd.keyword,
                status: cmd.status,
            })
            .await
    }

    async fn update(&self, id: i64, cmd: UpdateDictCmd) -> AppResult<Dict> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        let mut dict = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))?;

        if let Some(parent_id) = cmd.parent_id {
            if dict.parent_id != Some(parent_id) {
                return Err(AppError::ValidationError(
                    "updating parent_id is not supported".to_string(),
                ));
            }
        }

        let sanitized_cmd = UpdateDictCmd {
            parent_id: None,
            dict_type: None,
            is_leaf: None,
            ..cmd
        };

        dict.apply_update(sanitized_cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&dict).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let mut parent_ids = HashSet::new();
        for id in &ids {
            let dict = self
                .repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("dict not found: {id}")))?;

            let child_count = self.repository.count_by_parent_id(*id).await?;
            if child_count > 0 {
                return Err(AppError::ValidationError(format!(
                    "dict still has {child_count} children: {id}"
                )));
            }

            if let Some(parent_id) = dict.parent_id {
                parent_ids.insert(parent_id);
            }
        }

        self.repository.hard_delete_batch(&ids).await?;

        for parent_id in parent_ids {
            self.sync_parent_leaf_state(parent_id).await?;
        }

        Ok(())
    }

    async fn remove_cascade(&self, cmd: RemoveCascadeDictCmd) -> AppResult<()> {
        let dict = self
            .repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("dict not found: {}", cmd.id)))?;

        let descendant_ids = self.repository.find_descendant_ids(cmd.id).await?;
        if descendant_ids.is_empty() {
            return Ok(());
        }

        self.repository.hard_delete_batch(&descendant_ids).await?;

        if let Some(parent_id) = dict.parent_id {
            self.sync_parent_leaf_state(parent_id).await?;
        }

        Ok(())
    }
}
