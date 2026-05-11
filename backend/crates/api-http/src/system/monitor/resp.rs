use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SystemSnapshotResp {
    pub cpu_usage: f32,
    pub cpu_count: u32,
    pub cpu_usage_cores: f32,
    pub per_core_usage: Vec<f32>,
    pub cpu_temp_celsius: Option<f32>,
    pub cpu_freq_mhz: Vec<u64>,
    pub memory_used: u64,
    pub memory_total: u64,
    pub swap_used: u64,
    pub swap_total: u64,
    pub disk_used: u64,
    pub disk_total: u64,
    pub net_rx_bytes: u64,
    pub net_tx_bytes: u64,
    pub uptime_secs: u64,
    pub process_memory_bytes: u64,
    pub process_virtual_memory_bytes: u64,
    pub process_cpu_percent: f32,
    pub db_pool_size: u32,
    pub db_pool_idle: u32,
    pub load_avg_1: f64,
    pub load_avg_5: f64,
    pub load_avg_15: f64,
    pub disk_read_speed: u64,
    pub disk_write_speed: u64,
    pub net_rx_speed: u64,
    pub net_tx_speed: u64,
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
}

#[derive(Debug, Serialize)]
pub struct HourlyStatResp {
    pub hour: String,
    pub total: i64,
    pub errors: i64,
    pub avg_latency_ms: f64,
}

#[derive(Debug, Serialize)]
pub struct AppStatsResp {
    pub success_rate: f64,
    pub p95_latency_ms: f64,
    pub p99_latency_ms: f64,
}

#[derive(Debug, Serialize)]
pub struct SlowEndpointResp {
    pub path: String,
    pub avg_latency_ms: f64,
    pub request_count: i64,
}

#[derive(Debug, Serialize)]
pub struct ErrorEndpointResp {
    pub path: String,
    pub error_count: i64,
    pub total_count: i64,
}

#[derive(Debug, Serialize)]
pub struct StatusDistributionResp {
    pub hour: String,
    pub ok_2xx: i64,
    pub err_4xx: i64,
    pub err_5xx: i64,
}

#[derive(Debug, Serialize)]
pub struct BusinessSummaryResp {
    pub total_users: i64,
    pub total_tenants: i64,
    pub total_roles: i64,
}

#[derive(Debug, Serialize)]
pub struct RedisStatsResp {
    pub pool_connections: u32,
    pub pool_idle: u32,
    pub pool_max_size: u32,
    pub used_memory_bytes: u64,
    pub used_memory_peak_bytes: u64,
    pub keyspace_hits: u64,
    pub keyspace_misses: u64,
    pub connected_clients: u64,
    pub total_commands_processed: u64,
    pub redis_version: String,
    pub redis_uptime_secs: u64,
}

#[derive(Debug, Serialize)]
pub struct DatabaseTopQueryResp {
    pub query: String,
    pub calls: i64,
    pub total_exec_time_ms: f64,
    pub mean_exec_time_ms: f64,
    pub rows: i64,
    pub shared_blks_hit: i64,
    pub shared_blks_read: i64,
}

#[derive(Debug, Serialize)]
pub struct PgStatStatementsStatsResp {
    pub available: bool,
    pub unavailable_reason_key: Option<String>,
    pub top_by_total_time: Vec<DatabaseTopQueryResp>,
    pub top_by_mean_time: Vec<DatabaseTopQueryResp>,
}

#[derive(Debug, Serialize)]
pub struct DatabaseStatsResp {
    pub pool_size: u32,
    pub pool_idle: u32,
    pub pool_active: u32,
    pub pool_utilization_rate: f64,
    pub connections_total: i64,
    pub connections_active: i64,
    pub connections_idle: i64,
    pub connections_waiting: i64,
    pub blocked_queries: i64,
    pub longest_running_query_secs: i64,
    pub stats_reset_at: Option<String>,
    pub commits: i64,
    pub rollbacks: i64,
    pub cache_hit_rate: f64,
    pub deadlocks: i64,
    pub temp_files: i64,
    pub temp_bytes: i64,
    pub db_size_bytes: i64,
    pub rows_returned: i64,
    pub rows_fetched: i64,
    pub rows_inserted: i64,
    pub rows_updated: i64,
    pub rows_deleted: i64,
    pub pg_stat_statements: PgStatStatementsStatsResp,
}

#[derive(Debug, Serialize)]
pub struct GpuDeviceInfoResp {
    pub index: u32,
    pub name: String,
    pub utilization_gpu: u32,
    pub utilization_memory: u32,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub temperature_celsius: Option<u32>,
    pub power_usage_watts: Option<f32>,
    pub power_limit_watts: Option<f32>,
    pub fan_speed_percent: Option<u32>,
    pub pstate: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GpuStatsResp {
    pub available: bool,
    pub devices: Vec<GpuDeviceInfoResp>,
}

#[derive(Debug, Serialize)]
pub struct MonitorMetricsResp {
    pub snapshot: SystemSnapshotResp,
    pub hourly_stats: Vec<HourlyStatResp>,
    pub app_stats: AppStatsResp,
    pub top_slow_endpoints: Vec<SlowEndpointResp>,
    pub top_error_endpoints: Vec<ErrorEndpointResp>,
    pub status_distribution: Vec<StatusDistributionResp>,
    pub business_summary: BusinessSummaryResp,
    pub redis_stats: RedisStatsResp,
    pub database_stats: DatabaseStatsResp,
    pub gpu_stats: GpuStatsResp,
}
