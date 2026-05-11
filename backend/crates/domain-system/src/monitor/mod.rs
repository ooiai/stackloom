pub mod repo;
pub mod service;

pub use repo::MonitorRepository;
pub use service::MonitorService;

#[derive(Debug, Clone)]
pub struct SystemSnapshot {
    /// Global CPU usage in percent (0–100).
    pub cpu_usage: f32,
    /// Number of CPU cores.
    pub cpu_count: u32,
    /// Estimated number of cores in use (cpu_usage * cpu_count / 100).
    pub cpu_usage_cores: f32,
    /// Per-core CPU usage in percent (0–100) for each core.
    pub per_core_usage: Vec<f32>,
    /// CPU temperature in Celsius (if available).
    pub cpu_temp_celsius: Option<f32>,
    /// Per-core CPU frequency in MHz.
    pub cpu_freq_mhz: Vec<u64>,
    /// Used memory in bytes.
    pub memory_used: u64,
    /// Total memory in bytes.
    pub memory_total: u64,
    /// Used swap in bytes.
    pub swap_used: u64,
    /// Total swap in bytes.
    pub swap_total: u64,
    /// Used disk space in bytes (aggregate across all mounted disks).
    pub disk_used: u64,
    /// Total disk space in bytes (aggregate across all mounted disks).
    pub disk_total: u64,
    /// Network received bytes since boot (aggregate across all interfaces).
    pub net_rx_bytes: u64,
    /// Network transmitted bytes since boot (aggregate across all interfaces).
    pub net_tx_bytes: u64,
    /// Process uptime in seconds.
    pub uptime_secs: u64,
    /// Current process RSS memory in bytes.
    pub process_memory_bytes: u64,
    /// Current process virtual memory in bytes.
    pub process_virtual_memory_bytes: u64,
    /// Current process CPU usage in percent (0–100).
    pub process_cpu_percent: f32,
    /// DB connection pool size (total connections).
    pub db_pool_size: u32,
    /// DB connection pool idle connections.
    pub db_pool_idle: u32,
    /// 1-minute load average.
    pub load_avg_1: f64,
    /// 5-minute load average.
    pub load_avg_5: f64,
    /// 15-minute load average.
    pub load_avg_15: f64,
}

/// A single GPU device's current metrics.
#[derive(Debug, Clone)]
pub struct GpuDeviceInfo {
    /// GPU index (0-based).
    pub index: u32,
    /// GPU product name (e.g. "NVIDIA GeForce RTX 4090").
    pub name: String,
    /// GPU core utilization in percent (0–100).
    pub utilization_gpu: u32,
    /// GPU memory controller utilization in percent (0–100).
    pub utilization_memory: u32,
    /// Used GPU memory in bytes.
    pub memory_used_bytes: u64,
    /// Total GPU memory in bytes.
    pub memory_total_bytes: u64,
    /// GPU die temperature in Celsius (None if unavailable).
    pub temperature_celsius: Option<u32>,
    /// Current power draw in watts (None if unavailable).
    pub power_usage_watts: Option<f32>,
    /// Power limit in watts (None if unavailable).
    pub power_limit_watts: Option<f32>,
    /// Fan speed in percent (None if unavailable or passive cooling).
    pub fan_speed_percent: Option<u32>,
    /// Performance state string (e.g. "P0", "P8"; None if unavailable).
    pub pstate: Option<String>,
}

/// GPU monitoring summary returned by `get_gpu_stats()`.
#[derive(Debug, Clone)]
pub struct GpuStats {
    /// `true` when at least one GPU was detected via nvidia-smi.
    pub available: bool,
    /// Per-device metrics (empty when `available` is false).
    pub devices: Vec<GpuDeviceInfo>,
}

#[derive(Debug, Clone)]
pub struct HourlyRequestStat {
    /// Hour bucket in ISO-8601 format (e.g. "2025-01-01T14:00:00Z").
    pub hour: String,
    /// Total requests in this hour.
    pub total: i64,
    /// Failed requests in this hour.
    pub errors: i64,
    /// Average latency in milliseconds.
    pub avg_latency_ms: f64,
}

/// Overall application performance stats for the last 24 hours.
#[derive(Debug, Clone)]
pub struct AppStats {
    /// Request success rate in percent (0–100).
    pub success_rate: f64,
    /// 95th-percentile latency in milliseconds.
    pub p95_latency_ms: f64,
    /// 99th-percentile latency in milliseconds.
    pub p99_latency_ms: f64,
}

/// A single endpoint latency stat.
#[derive(Debug, Clone)]
pub struct SlowEndpoint {
    pub path: String,
    pub avg_latency_ms: f64,
    pub request_count: i64,
}

/// A single endpoint error stat.
#[derive(Debug, Clone)]
pub struct ErrorEndpoint {
    pub path: String,
    pub error_count: i64,
    pub total_count: i64,
}

/// Hourly status-code distribution bucket.
#[derive(Debug, Clone)]
pub struct StatusDistribution {
    /// Hour bucket in ISO-8601 format.
    pub hour: String,
    /// 2xx responses.
    pub ok_2xx: i64,
    /// 4xx responses.
    pub err_4xx: i64,
    /// 5xx responses.
    pub err_5xx: i64,
}

/// Business entity counts.
#[derive(Debug, Clone)]
pub struct BusinessSummary {
    pub total_users: i64,
    pub total_tenants: i64,
    pub total_roles: i64,
}

/// Redis server and connection pool stats.
#[derive(Debug, Clone)]
pub struct RedisStats {
    /// Current connections checked out from the pool.
    pub pool_connections: u32,
    /// Idle connections in the pool.
    pub pool_idle: u32,
    /// Configured maximum pool size.
    pub pool_max_size: u32,
    /// Memory currently used by Redis (bytes).
    pub used_memory_bytes: u64,
    /// Peak memory ever used by Redis (bytes).
    pub used_memory_peak_bytes: u64,
    /// Total keyspace hit count since start.
    pub keyspace_hits: u64,
    /// Total keyspace miss count since start.
    pub keyspace_misses: u64,
    /// Number of clients currently connected to Redis.
    pub connected_clients: u64,
    /// Total number of commands processed by Redis since start.
    pub total_commands_processed: u64,
    /// Redis server version string.
    pub redis_version: String,
    /// Redis server uptime in seconds.
    pub redis_uptime_secs: u64,
}

/// A single query statistic from pg_stat_statements.
#[derive(Debug, Clone)]
pub struct DatabaseTopQuery {
    pub query: String,
    pub calls: i64,
    pub total_exec_time_ms: f64,
    pub mean_exec_time_ms: f64,
    pub rows: i64,
    pub shared_blks_hit: i64,
    pub shared_blks_read: i64,
}

/// Optional pg_stat_statements block status and results.
#[derive(Debug, Clone)]
pub struct PgStatStatementsStats {
    pub available: bool,
    pub unavailable_reason_key: Option<String>,
    pub top_by_total_time: Vec<DatabaseTopQuery>,
    pub top_by_mean_time: Vec<DatabaseTopQuery>,
}

/// PostgreSQL monitoring statistics.
#[derive(Debug, Clone)]
pub struct DatabaseStats {
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
    pub pg_stat_statements: PgStatStatementsStats,
}
