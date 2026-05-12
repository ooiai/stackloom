use neocrates::{async_trait::async_trait, response::error::AppResult};

use super::{
    StatsBehaviorView, StatsFunnelView, StatsGrowthView, StatsOverviewView, StatsQueryCmd,
    StatsRetentionView,
};

#[async_trait]
pub trait StatsService: Send + Sync {
    async fn get_overview(&self, cmd: StatsQueryCmd) -> AppResult<StatsOverviewView>;
    async fn get_growth(&self, cmd: StatsQueryCmd) -> AppResult<StatsGrowthView>;
    async fn get_retention(&self, cmd: StatsQueryCmd) -> AppResult<StatsRetentionView>;
    async fn get_behavior(&self, cmd: StatsQueryCmd) -> AppResult<StatsBehaviorView>;
    async fn get_funnel(&self) -> AppResult<StatsFunnelView>;
}
