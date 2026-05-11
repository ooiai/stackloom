use std::sync::Arc;

use domain_system::{
    AppStats, BusinessSummary, DatabaseStats, ErrorEndpoint, GpuDeviceInfo, GpuStats,
    HourlyRequestStat, MonitorRepository, MonitorService, RedisStats, SlowEndpoint,
    StatusDistribution, SystemSnapshot,
};
use neocrates::{
    async_trait::async_trait,
    rediscache::RedisPool,
    response::error::{AppError, AppResult},
    sqlxhelper::pool::SqlxPool,
};

use super::collector::SystemMetricsCollector;
use super::repo::SqlxMonitorRepository;

#[derive(Clone)]
pub struct MonitorServiceImpl<R>
where
    R: MonitorRepository,
{
    repository: Arc<R>,
    pool: Arc<SqlxPool>,
    redis_pool: Arc<RedisPool>,
    metrics_collector: Arc<SystemMetricsCollector>,
}

impl MonitorServiceImpl<SqlxMonitorRepository> {
    pub fn new(
        pool: Arc<SqlxPool>,
        redis_pool: Arc<RedisPool>,
        start_time: Arc<std::time::Instant>,
    ) -> (Self, neocrates::tokio::task::JoinHandle<()>) {
        let (collector, task_handle) = SystemMetricsCollector::new(start_time);
        let metrics_collector = Arc::new(collector);

        let service = Self {
            repository: Arc::new(SqlxMonitorRepository::new(pool.clone())),
            pool,
            redis_pool,
            metrics_collector,
        };

        (service, task_handle)
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
        metrics_collector: Arc<SystemMetricsCollector>,
    ) -> Self {
        Self {
            repository,
            pool,
            redis_pool,
            metrics_collector,
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
        let mut snapshot = self.metrics_collector.get_snapshot().await;

        // Update database pool info which comes from the current state
        let db_pool_size = self.pool.pool().size();
        let db_pool_idle = self.pool.pool().num_idle() as u32;

        snapshot.db_pool_size = db_pool_size;
        snapshot.db_pool_idle = db_pool_idle;

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

    async fn get_gpu_stats(&self) -> AppResult<GpuStats> {
        // Query fields: index, name, utilization.gpu, utilization.memory,
        //               memory.used (MiB), memory.total (MiB),
        //               temperature.gpu, power.draw, power.limit,
        //               fan.speed, pstate
        let output = neocrates::tokio::process::Command::new("nvidia-smi")
            .args([
                "--query-gpu=index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu,power.draw,power.limit,fan.speed,pstate",
                "--format=csv,noheader,nounits",
            ])
            .output()
            .await;

        let output = match output {
            Ok(o) if o.status.success() => o,
            _ => {
                return Ok(GpuStats {
                    available: false,
                    devices: vec![],
                });
            }
        };

        let stdout = match String::from_utf8(output.stdout) {
            Ok(s) => s,
            Err(_) => {
                return Ok(GpuStats {
                    available: false,
                    devices: vec![],
                });
            }
        };

        let mut devices = Vec::new();

        for line in stdout.lines() {
            let parts: Vec<&str> = line.split(',').map(str::trim).collect();
            if parts.len() < 11 {
                continue;
            }

            let index = parts[0].parse::<u32>().unwrap_or(0);
            let name = parts[1].to_string();
            let utilization_gpu = parts[2].parse::<u32>().unwrap_or(0);
            let utilization_memory = parts[3].parse::<u32>().unwrap_or(0);
            // nvidia-smi reports MiB; convert to bytes
            let memory_used_bytes = parts[4].parse::<u64>().unwrap_or(0) * 1024 * 1024;
            let memory_total_bytes = parts[5].parse::<u64>().unwrap_or(0) * 1024 * 1024;
            let temperature_celsius = parts[6].parse::<u32>().ok();
            let power_usage_watts = parts[7].parse::<f32>().ok();
            let power_limit_watts = parts[8].parse::<f32>().ok();
            let fan_speed_percent = parts[9].parse::<u32>().ok();
            let pstate = if parts[10].is_empty() || parts[10] == "N/A" {
                None
            } else {
                Some(parts[10].to_string())
            };

            devices.push(GpuDeviceInfo {
                index,
                name,
                utilization_gpu,
                utilization_memory,
                memory_used_bytes,
                memory_total_bytes,
                temperature_celsius,
                power_usage_watts,
                power_limit_watts,
                fan_speed_percent,
                pstate,
            });
        }

        Ok(GpuStats {
            available: !devices.is_empty(),
            devices,
        })
    }
}
