use std::sync::Arc;
use std::time::Instant;

use domain_system::{
    AppStats, BusinessSummary, DatabaseStats, ErrorEndpoint, HourlyRequestStat, MonitorRepository,
    MonitorService, RedisStats, SlowEndpoint, StatusDistribution, SystemSnapshot,
};
use neocrates::{
    async_trait::async_trait,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
    tokio,
};
use sysinfo::{Disks, Networks, System, get_current_pid};

use super::repo::SqlxMonitorRepository;

#[derive(Clone)]
pub struct MonitorServiceImpl<R>
where
    R: MonitorRepository,
{
    repository: Arc<R>,
    pool: Arc<SqlxPool>,
    start_time: Arc<Instant>,
    redis_pool: Arc<RedisPool>,
}

impl MonitorServiceImpl<SqlxMonitorRepository> {
    pub fn new(pool: Arc<SqlxPool>, redis_pool: Arc<RedisPool>, start_time: Arc<Instant>) -> Self {
        Self {
            repository: Arc::new(SqlxMonitorRepository::new(pool.clone())),
            pool,
            start_time,
            redis_pool,
        }
    }
}

impl<R> MonitorServiceImpl<R>
where
    R: MonitorRepository,
{
    pub fn with_repository(
        repository: Arc<R>,
        pool: Arc<SqlxPool>,
        redis_pool: Arc<RedisPool>,
        start_time: Arc<Instant>,
    ) -> Self {
        Self {
            repository,
            pool,
            start_time,
            redis_pool,
        }
    }
}

/// Parse a key from Redis INFO output (lines of "key:value").
fn parse_info_field<T: std::str::FromStr + Default>(info: &str, key: &str) -> T {
    info.lines()
        .find(|line| line.starts_with(key))
        .and_then(|line| line.splitn(2, ':').nth(1))
        .and_then(|v| v.trim().parse::<T>().ok())
        .unwrap_or_default()
}

#[async_trait]
impl<R> MonitorService for MonitorServiceImpl<R>
where
    R: MonitorRepository,
{
    async fn get_metrics(&self) -> AppResult<SystemSnapshot> {
        let uptime_secs = self.start_time.elapsed().as_secs();
        let db_pool_size = self.pool.pool().size();
        let db_pool_idle = self.pool.pool().num_idle() as u32;

        let snapshot = tokio::task::spawn_blocking(move || {
            let mut sys = System::new_all();
            sys.refresh_all();

            let cpu_usage = sys.global_cpu_usage();
            let memory_used = sys.used_memory();
            let memory_total = sys.total_memory();

            let disks = Disks::new_with_refreshed_list();
            let (disk_used, disk_total) = disks.iter().fold((0u64, 0u64), |(used, total), d| {
                let d_total = d.total_space();
                let d_avail = d.available_space();
                let d_used = d_total.saturating_sub(d_avail);
                (used + d_used, total + d_total)
            });

            let networks = Networks::new_with_refreshed_list();
            let (net_rx_bytes, net_tx_bytes) =
                networks.iter().fold((0u64, 0u64), |(rx, tx), (_, data)| {
                    (rx + data.total_received(), tx + data.total_transmitted())
                });

            let (process_memory_bytes, process_virtual_memory_bytes, process_cpu_percent) =
                get_current_pid()
                    .ok()
                    .and_then(|pid| sys.process(pid))
                    .map(|p| (p.memory(), p.virtual_memory(), p.cpu_usage()))
                    .unwrap_or((0, 0, 0.0));

            SystemSnapshot {
                cpu_usage,
                memory_used,
                memory_total,
                disk_used,
                disk_total,
                net_rx_bytes,
                net_tx_bytes,
                uptime_secs,
                process_memory_bytes,
                process_virtual_memory_bytes,
                process_cpu_percent,
                db_pool_size,
                db_pool_idle,
            }
        })
        .await
        .map_err(|e| AppError::data_here(format!("monitor metrics error: {e}")))?;

        Ok(snapshot)
    }

    async fn get_request_stats(&self) -> AppResult<Vec<HourlyRequestStat>> {
        self.repository.get_request_stats().await
    }

    async fn get_app_stats(&self) -> AppResult<AppStats> {
        self.repository.get_app_stats().await
    }

    async fn get_top_slow_endpoints(&self) -> AppResult<Vec<SlowEndpoint>> {
        self.repository.get_top_slow_endpoints().await
    }

    async fn get_top_error_endpoints(&self) -> AppResult<Vec<ErrorEndpoint>> {
        self.repository.get_top_error_endpoints().await
    }

    async fn get_status_distribution(&self) -> AppResult<Vec<StatusDistribution>> {
        self.repository.get_status_distribution().await
    }

    async fn get_business_summary(&self) -> AppResult<BusinessSummary> {
        self.repository.get_business_summary().await
    }

    async fn get_redis_stats(&self) -> AppResult<RedisStats> {
        let pool_status = self.redis_pool.get_pool_status();

        let mut conn = self
            .redis_pool
            .get_connection()
            .await
            .map_err(|e| AppError::data_here(format!("redis connection error: {e}")))?;

        let info: String = neocrates::redis::cmd("INFO")
            .arg("all")
            .query_async(&mut *conn)
            .await
            .map_err(|e: neocrates::redis::RedisError| AppError::data_here(e.to_string()))?;

        Ok(RedisStats {
            pool_connections: pool_status.connections,
            pool_idle: pool_status.idle_connections,
            pool_max_size: pool_status.max_size,
            used_memory_bytes: parse_info_field::<u64>(&info, "used_memory:"),
            used_memory_peak_bytes: parse_info_field::<u64>(&info, "used_memory_peak:"),
            keyspace_hits: parse_info_field::<u64>(&info, "keyspace_hits:"),
            keyspace_misses: parse_info_field::<u64>(&info, "keyspace_misses:"),
            connected_clients: parse_info_field::<u64>(&info, "connected_clients:"),
            total_commands_processed: parse_info_field::<u64>(&info, "total_commands_processed:"),
            redis_version: parse_info_field::<String>(&info, "redis_version:"),
            redis_uptime_secs: parse_info_field::<u64>(&info, "uptime_in_seconds:"),
        })
    }

    async fn get_database_stats(&self) -> AppResult<DatabaseStats> {
        let mut stats = self.repository.get_database_stats().await?;
        let pool_size = self.pool.pool().size();
        let pool_idle = self.pool.pool().num_idle() as u32;
        let pool_active = pool_size.saturating_sub(pool_idle);

        stats.pool_size = pool_size;
        stats.pool_idle = pool_idle;
        stats.pool_active = pool_active;
        stats.pool_utilization_rate = if pool_size > 0 {
            (pool_active as f64 / pool_size as f64) * 100.0
        } else {
            0.0
        };

        Ok(stats)
    }
}
