use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use domain_base::{
    CreateTenantCmd, PageTenantCmd, Tenant, TenantRepository, TenantService, UpdateTenantCmd,
    tenant::{
        ChildrenTenantCmd, RemoveCascadeTenantCmd, TenantChildrenQuery, TenantPageQuery,
        TenantTreeQuery, TreeTenantCmd,
    },
};
use neocrates::{
    async_trait::async_trait,
    helper::core::snowflake::generate_sonyflake_id,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::repo::SqlxTenantRepository;

#[derive(Clone)]
pub struct TenantServiceImpl<R>
where
    R: TenantRepository,
{
    repository: Arc<R>,
}

impl TenantServiceImpl<SqlxTenantRepository> {
    pub fn new(pool: Arc<SqlxPool>) -> Self {
        Self {
            repository: Arc::new(SqlxTenantRepository::new(pool)),
        }
    }
}

impl<R> TenantServiceImpl<R>
where
    R: TenantRepository,
{
    pub fn with_repository(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl<R> TenantService for TenantServiceImpl<R>
where
    R: TenantRepository,
{
    async fn create(&self, mut cmd: CreateTenantCmd) -> AppResult<Tenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(parent_id) = cmd.parent_id {
            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("tenant parent not found: {parent_id}"))
                })?;
        }

        cmd.id = generate_sonyflake_id() as i64;

        let tenant = Tenant::new(cmd).map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.create(&tenant).await
    }

    async fn get(&self, id: i64) -> AppResult<Tenant> {
        self.repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))
    }

    async fn page(&self, cmd: PageTenantCmd) -> AppResult<(Vec<Tenant>, i64)> {
        let query = TenantPageQuery {
            keyword: cmd.keyword,
            status: cmd.status,
            limit: cmd.limit,
            offset: cmd.offset,
        };

        self.repository.page(&query).await
    }

    async fn tree(&self, cmd: TreeTenantCmd) -> AppResult<Vec<Tenant>> {
        let tenants = self
            .repository
            .list_for_tree(&TenantTreeQuery { status: cmd.status })
            .await?;

        let keyword = cmd.keyword.unwrap_or_default();
        let trimmed = keyword.trim();
        if trimmed.is_empty() {
            return Ok(tenants);
        }

        let parent_by_id = tenants
            .iter()
            .map(|tenant| (tenant.id, tenant.parent_id))
            .collect::<HashMap<_, _>>();

        let mut included_ids = HashSet::new();
        for tenant in &tenants {
            if !tenant.matches_keyword(trimmed) {
                continue;
            }

            let mut current_id = Some(tenant.id);
            while let Some(id) = current_id {
                if !included_ids.insert(id) {
                    break;
                }
                current_id = parent_by_id.get(&id).copied().flatten();
            }
        }

        Ok(tenants
            .into_iter()
            .filter(|tenant| included_ids.contains(&tenant.id))
            .collect())
    }

    async fn children(&self, cmd: ChildrenTenantCmd) -> AppResult<Vec<Tenant>> {
        self.repository
            .list_by_parent(&TenantChildrenQuery {
                parent_id: cmd.parent_id,
                keyword: cmd.keyword,
                status: cmd.status,
            })
            .await
    }

    async fn update(&self, id: i64, cmd: UpdateTenantCmd) -> AppResult<Tenant> {
        cmd.validate()
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        if let Some(parent_id) = cmd.parent_id {
            if parent_id == id {
                return Err(AppError::ValidationError(
                    "tenant cannot set itself as parent".to_string(),
                ));
            }

            self.repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| {
                    AppError::not_found_here(format!("tenant parent not found: {parent_id}"))
                })?;

            let descendants = self.repository.find_descendant_ids(id).await?;
            if descendants.contains(&parent_id) {
                return Err(AppError::ValidationError(
                    "tenant parent cannot be a descendant".to_string(),
                ));
            }
        }

        let mut tenant = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))?;

        tenant
            .apply_update(cmd)
            .map_err(|err| AppError::ValidationError(err.to_string()))?;

        self.repository.update(&tenant).await
    }

    async fn delete(&self, ids: Vec<i64>) -> AppResult<()> {
        if ids.is_empty() {
            return Ok(());
        }

        for id in &ids {
            self.repository
                .find_by_id(*id)
                .await?
                .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {id}")))?;

            let child_count = self.repository.count_by_parent_id(*id).await?;
            if child_count > 0 {
                return Err(AppError::ValidationError(format!(
                    "tenant still has {child_count} children: {id}"
                )));
            }
        }

        self.repository.hard_delete_batch(&ids).await
    }

    async fn remove_cascade(&self, cmd: RemoveCascadeTenantCmd) -> AppResult<()> {
        self.repository
            .find_by_id(cmd.id)
            .await?
            .ok_or_else(|| AppError::not_found_here(format!("tenant not found: {}", cmd.id)))?;

        let descendant_ids = self.repository.find_descendant_ids(cmd.id).await?;
        if descendant_ids.is_empty() {
            return Ok(());
        }

        self.repository.hard_delete_batch(&descendant_ids).await
    }

    async fn list_by_user_id(&self, user_id: i64) -> AppResult<Vec<(Tenant, bool)>> {
        self.repository.list_by_user_id(user_id).await
    }
}
