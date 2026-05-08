use neocrates::{async_trait::async_trait, response::error::AppResult};

use super::{
    AppStats, BusinessSummary, DatabaseStats, ErrorEndpoint, HourlyRequestStat, SlowEndpoint,
    StatusDistribution,
};

/// Repository trait for monitor SQL-derived statistics.
/// All implementations live in infra-system.
#[async_trait]
pub trait MonitorRepository: Send + Sync {
    async fn get_request_stats(&self) -> AppResult<Vec<HourlyRequestStat>>;
    async fn get_app_stats(&self) -> AppResult<AppStats>;
    async fn get_top_slow_endpoints(&self) -> AppResult<Vec<SlowEndpoint>>;
    async fn get_top_error_endpoints(&self) -> AppResult<Vec<ErrorEndpoint>>;
    async fn get_status_distribution(&self) -> AppResult<Vec<StatusDistribution>>;
    async fn get_business_summary(&self) -> AppResult<BusinessSummary>;
    async fn get_database_stats(&self) -> AppResult<DatabaseStats>;
}
