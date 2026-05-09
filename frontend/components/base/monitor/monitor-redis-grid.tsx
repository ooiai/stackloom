"use client"

import { DatabaseIcon, ServerIcon, TimerIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { RedisStats } from "@/types/monitor.types"
import { formatBytes, formatUptime } from "./helpers"

interface MonitorRedisGridProps {
  redisStats: RedisStats
}

export function MonitorRedisGrid({ redisStats }: MonitorRedisGridProps) {
  const { t } = useI18n()

  const poolUsed = redisStats.pool_connections - redisStats.pool_idle
  const totalRequests = redisStats.keyspace_hits + redisStats.keyspace_misses
  const hitRate =
    totalRequests > 0
      ? Math.round((redisStats.keyspace_hits / totalRequests) * 100)
      : 100

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.redis_pool")}
        value={`${poolUsed} / ${redisStats.pool_max_size}`}
        hint={`${t("monitor.redis_pool_idle")}: ${redisStats.pool_idle}`}
        tone={poolUsed >= redisStats.pool_max_size ? "warning" : "default"}
        icon={<ServerIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.redis_memory")}
        value={formatBytes(redisStats.used_memory_bytes)}
        hint={`${t("monitor.redis_memory_peak")}: ${formatBytes(redisStats.used_memory_peak_bytes)}`}
        tone="default"
        icon={<DatabaseIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.redis_hit_rate")}
        value={`${hitRate}%`}
        hint={`${t("monitor.redis_hits")}: ${redisStats.keyspace_hits.toLocaleString()} / ${t("monitor.redis_misses")}: ${redisStats.keyspace_misses.toLocaleString()}`}
        tone={hitRate < 50 ? "warning" : "success"}
        icon={<DatabaseIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
        footer={t("monitor.redis_hit_rate_summary")}
      />
      <MetricCard
        label={t("monitor.redis_uptime")}
        value={formatUptime(redisStats.redis_uptime_secs)}
        hint={`Redis ${redisStats.redis_version} · ${redisStats.connected_clients} ${t("monitor.redis_clients")}`}
        tone="default"
        icon={<TimerIcon className="size-4" />}
        className="xl:col-span-3"
      />
      <MetricCard
        label={t("monitor.redis_commands")}
        value={redisStats.total_commands_processed.toLocaleString()}
        hint={t("monitor.redis_commands_hint")}
        tone="default"
        icon={<ServerIcon className="size-4" />}
        className="xl:col-span-3"
      />
    </div>
  )
}
