"use client"

import {
  CircleDashedIcon,
  DatabaseIcon,
  GitBranchPlusIcon,
  HardDriveIcon,
  ShieldAlertIcon,
  TimerIcon,
  UnplugIcon,
} from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { DatabaseStats } from "@/types/monitor.types"
import { formatBytes, formatDateTime, formatUptime } from "./helpers"

interface MonitorDatabaseGridProps {
  databaseStats: DatabaseStats
}

export function MonitorDatabaseGrid({ databaseStats }: MonitorDatabaseGridProps) {
  const { t } = useI18n()
  const cacheHitRate = Math.round(databaseStats.cache_hit_rate * 10) / 10
  const poolUtilization = Math.round(databaseStats.pool_utilization_rate)

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.db_pool")}
        value={`${databaseStats.pool_active} / ${databaseStats.pool_size}`}
        hint={`${t("monitor.db_pool_idle")}: ${databaseStats.pool_idle} · ${t("monitor.db_pool_utilization")}: ${poolUtilization}%`}
        tone={poolUtilization >= 85 ? "warning" : "default"}
        icon={<UnplugIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
      />
      <MetricCard
        label={t("monitor.db_connections")}
        value={`${databaseStats.connections_active} / ${databaseStats.connections_total}`}
        hint={`${t("monitor.db_connections_idle")}: ${databaseStats.connections_idle}`}
        tone={databaseStats.connections_waiting > 0 ? "warning" : "default"}
        icon={<DatabaseIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_waiting")}
        value={`${databaseStats.connections_waiting} / ${databaseStats.blocked_queries}`}
        hint={t("monitor.db_waiting_hint")}
        tone={databaseStats.blocked_queries > 0 ? "warning" : "default"}
        icon={<CircleDashedIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_longest_query")}
        value={formatUptime(databaseStats.longest_running_query_secs)}
        hint={t("monitor.db_longest_query_hint")}
        tone={databaseStats.longest_running_query_secs >= 60 ? "warning" : "default"}
        icon={<TimerIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_cache_hit_rate")}
        value={`${cacheHitRate}%`}
        hint={`${t("monitor.db_stats_reset_at")}: ${formatDateTime(databaseStats.stats_reset_at)}`}
        tone={cacheHitRate >= 99 ? "success" : cacheHitRate >= 95 ? "default" : "warning"}
        icon={<DatabaseIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
      />
      <MetricCard
        label={t("monitor.db_transactions")}
        value={databaseStats.commits.toLocaleString()}
        hint={`${t("monitor.db_rollbacks")}: ${databaseStats.rollbacks.toLocaleString()}`}
        tone={databaseStats.rollbacks > 0 ? "warning" : "default"}
        icon={<GitBranchPlusIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_temp_io")}
        value={databaseStats.temp_files.toLocaleString()}
        hint={`${t("monitor.db_temp_bytes")}: ${formatBytes(databaseStats.temp_bytes)}`}
        tone={databaseStats.temp_files > 0 ? "warning" : "default"}
        icon={<HardDriveIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_size")}
        value={formatBytes(databaseStats.db_size_bytes)}
        hint={t("monitor.db_size_hint")}
        tone="default"
        icon={<HardDriveIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.db_deadlocks")}
        value={databaseStats.deadlocks.toLocaleString()}
        hint={`${t("monitor.db_temp_bytes")}: ${formatBytes(databaseStats.temp_bytes)}`}
        tone={databaseStats.deadlocks > 0 ? "warning" : "default"}
        icon={<ShieldAlertIcon className="size-4" />}
        className="xl:col-span-2"
      />
    </div>
  )
}
