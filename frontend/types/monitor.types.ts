export interface SystemSnapshot {
  cpu_usage: number
  cpu_count: number
  cpu_usage_cores: number
  per_core_usage: number[]
  cpu_temp_celsius: number | null
  cpu_freq_mhz: number[]
  memory_used: number
  memory_total: number
  disk_used: number
  disk_total: number
  net_rx_bytes: number
  net_tx_bytes: number
  uptime_secs: number
  process_memory_bytes: number
  process_virtual_memory_bytes: number
  process_cpu_percent: number
  db_pool_size: number
  db_pool_idle: number
}

export interface HourlyStat {
  hour: string
  total: number
  errors: number
  avg_latency_ms: number
}

export interface AppStats {
  success_rate: number
  p95_latency_ms: number
  p99_latency_ms: number
}

export interface SlowEndpoint {
  path: string
  avg_latency_ms: number
  request_count: number
}

export interface ErrorEndpoint {
  path: string
  error_count: number
  total_count: number
}

export interface StatusDistribution {
  hour: string
  ok_2xx: number
  err_4xx: number
  err_5xx: number
}

export interface BusinessSummary {
  total_users: number
  total_tenants: number
  total_roles: number
}

export interface RedisStats {
  pool_connections: number
  pool_idle: number
  pool_max_size: number
  used_memory_bytes: number
  used_memory_peak_bytes: number
  keyspace_hits: number
  keyspace_misses: number
  connected_clients: number
  total_commands_processed: number
  redis_version: string
  redis_uptime_secs: number
}

export interface DatabaseTopQuery {
  query: string
  calls: number
  total_exec_time_ms: number
  mean_exec_time_ms: number
  rows: number
  shared_blks_hit: number
  shared_blks_read: number
}

export interface PgStatStatementsStats {
  available: boolean
  unavailable_reason_key: string | null
  top_by_total_time: DatabaseTopQuery[]
  top_by_mean_time: DatabaseTopQuery[]
}

export interface DatabaseStats {
  pool_size: number
  pool_idle: number
  pool_active: number
  pool_utilization_rate: number
  connections_total: number
  connections_active: number
  connections_idle: number
  connections_waiting: number
  blocked_queries: number
  longest_running_query_secs: number
  stats_reset_at: string | null
  commits: number
  rollbacks: number
  cache_hit_rate: number
  deadlocks: number
  temp_files: number
  temp_bytes: number
  db_size_bytes: number
  rows_returned: number
  rows_fetched: number
  rows_inserted: number
  rows_updated: number
  rows_deleted: number
  pg_stat_statements: PgStatStatementsStats
}

export interface MonitorMetrics {
  snapshot: SystemSnapshot
  hourly_stats: HourlyStat[]
  app_stats: AppStats
  top_slow_endpoints: SlowEndpoint[]
  top_error_endpoints: ErrorEndpoint[]
  status_distribution: StatusDistribution[]
  business_summary: BusinessSummary
  redis_stats: RedisStats
  database_stats: DatabaseStats
}
