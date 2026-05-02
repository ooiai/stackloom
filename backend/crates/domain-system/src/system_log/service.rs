use neocrates::{async_trait::async_trait, response::error::AppResult};

use crate::{CreateSystemLogCmd, ListSystemLogCmd, PageSystemLogCmd, SystemLog};

#[async_trait]
pub trait SystemLogService: Send + Sync {
    async fn create(&self, cmd: CreateSystemLogCmd) -> AppResult<SystemLog>;

    async fn page(&self, cmd: PageSystemLogCmd) -> AppResult<(Vec<SystemLog>, i64)>;

    async fn list(&self, cmd: ListSystemLogCmd) -> AppResult<Vec<SystemLog>>;
}
