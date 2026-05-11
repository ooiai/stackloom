"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { monitorApi } from "@/stores/monitor-api"
import type { MonitorMetrics, SystemSnapshot } from "@/types/monitor.types"

const EMPTY_SNAPSHOT: SystemSnapshot = {
  cpu_usage: 0,
  cpu_count: 0,
  cpu_usage_cores: 0,
  per_core_usage: [],
  cpu_temp_celsius: null,
  cpu_freq_mhz: [],
  memory_used: 0,
  memory_total: 0,
  swap_used: 0,
  swap_total: 0,
  disk_used: 0,
  disk_total: 0,
  net_rx_bytes: 0,
  net_tx_bytes: 0,
  uptime_secs: 0,
  process_memory_bytes: 0,
  process_virtual_memory_bytes: 0,
  process_cpu_percent: 0,
  db_pool_size: 0,
  db_pool_idle: 0,
  load_avg_1: 0,
  load_avg_5: 0,
  load_avg_15: 0,
  disk_read_speed: 0,
  disk_write_speed: 0,
  net_rx_speed: 0,
  net_tx_speed: 0,
  hostname: "",
  os_name: "",
  os_version: "",
  kernel_version: "",
}

const EMPTY_METRICS: MonitorMetrics = {
  snapshot: EMPTY_SNAPSHOT,
  hourly_stats: [],
  app_stats: {
    success_rate: 100,
    p95_latency_ms: 0,
    p99_latency_ms: 0,
  },
  top_slow_endpoints: [],
  top_error_endpoints: [],
  status_distribution: [],
  business_summary: {
    total_users: 0,
    total_tenants: 0,
    total_roles: 0,
  },
  redis_stats: {
    pool_connections: 0,
    pool_idle: 0,
    pool_max_size: 0,
    used_memory_bytes: 0,
    used_memory_peak_bytes: 0,
    keyspace_hits: 0,
    keyspace_misses: 0,
    connected_clients: 0,
    total_commands_processed: 0,
    redis_version: "-",
    redis_uptime_secs: 0,
  },
  database_stats: {
    pool_size: 0,
    pool_idle: 0,
    pool_active: 0,
    pool_utilization_rate: 0,
    connections_total: 0,
    connections_active: 0,
    connections_idle: 0,
    connections_waiting: 0,
    blocked_queries: 0,
    longest_running_query_secs: 0,
    stats_reset_at: null,
    commits: 0,
    rollbacks: 0,
    cache_hit_rate: 0,
    deadlocks: 0,
    temp_files: 0,
    temp_bytes: 0,
    db_size_bytes: 0,
    rows_returned: 0,
    rows_fetched: 0,
    rows_inserted: 0,
    rows_updated: 0,
    rows_deleted: 0,
    pg_stat_statements: {
      available: false,
      unavailable_reason_key: null,
      top_by_total_time: [],
      top_by_mean_time: [],
    },
  },
  gpu_stats: {
    available: false,
    devices: [],
  },
}

const HISTORY_MAX = 20

export function useMonitorController() {
  const metricsQuery = useQuery({
    queryKey: ["monitor", "metrics"],
    queryFn: () => monitorApi.getMetrics(),
    refetchInterval: 30_000,
  })

  // Accumulate last HISTORY_MAX snapshots for sparkline trend lines
  const historyRef = useRef<SystemSnapshot[]>([])
  const [snapshotHistory, setSnapshotHistory] = useState<SystemSnapshot[]>([])

  useEffect(() => {
    if (metricsQuery.data) {
      historyRef.current = [
        ...historyRef.current.slice(-(HISTORY_MAX - 1)),
        metricsQuery.data.snapshot,
      ]
      setSnapshotHistory([...historyRef.current])
    }
  }, [metricsQuery.data])

  const handleRefresh = useCallback(() => {
    void metricsQuery.refetch()
  }, [metricsQuery])

  const metrics = metricsQuery.data ?? EMPTY_METRICS

  return {
    view: {
      metrics,
      snapshotHistory,
      isFetching: metricsQuery.isFetching,
      onRefresh: handleRefresh,
    },
  }
}
