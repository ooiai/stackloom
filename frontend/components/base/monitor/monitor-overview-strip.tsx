"use client"

import { ActivityIcon, AlertTriangleIcon, GaugeIcon, TimerIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { MonitorMetrics } from "@/types/monitor.types"

interface MonitorOverviewStripProps {
  metrics: MonitorMetrics
}

export function MonitorOverviewStrip({ metrics }: MonitorOverviewStripProps) {
  const { t } = useI18n()

  const totalRequests = metrics.hourly_stats.reduce((sum, item) => sum + item.total, 0)
  const totalErrors = metrics.hourly_stats.reduce((sum, item) => sum + item.errors, 0)
  const avgLatency = metrics.hourly_stats.length
    ? Math.round(
        metrics.hourly_stats.reduce((sum, item) => sum + item.avg_latency_ms, 0) /
          metrics.hourly_stats.length
      )
    : 0
  const processCpu = Math.round(metrics.snapshot.process_cpu_percent)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label={t("monitor.overview_requests")}
        value={totalRequests.toLocaleString()}
        subValue={t("monitor.last_24_hours")}
        hint={t("monitor.overview_requests_hint")}
        footer={`${t("monitor.errors")}: ${totalErrors.toLocaleString()}`}
        tone="default"
        size="hero"
        icon={<ActivityIcon className="size-4" />}
      />
      <MetricCard
        label={t("monitor.overview_errors")}
        value={totalErrors.toLocaleString()}
        subValue={t("monitor.last_24_hours")}
        hint={t("monitor.overview_errors_hint")}
        footer={`${t("monitor.success_rate")}: ${Math.round(metrics.app_stats.success_rate * 10) / 10}%`}
        tone={totalErrors > 0 ? "warning" : "success"}
        size="hero"
        icon={<AlertTriangleIcon className="size-4" />}
      />
      <MetricCard
        label={t("monitor.overview_latency")}
        value={`${avgLatency} ms`}
        subValue={t("monitor.last_24_hours")}
        hint={t("monitor.overview_latency_hint")}
        footer={`${t("monitor.p95_latency")}: ${Math.round(metrics.app_stats.p95_latency_ms)} ms`}
        tone={avgLatency >= 500 ? "warning" : "default"}
        size="hero"
        icon={<TimerIcon className="size-4" />}
      />
      <MetricCard
        label={t("monitor.overview_runtime")}
        value={`${processCpu}%`}
        subValue={t("monitor.process_cpu")}
        hint={t("monitor.overview_runtime_hint")}
        footer={`${t("monitor.db_cache_hit_rate")}: ${Math.round(metrics.database_stats.cache_hit_rate * 10) / 10}%`}
        tone={processCpu >= 80 ? "warning" : "success"}
        size="hero"
        icon={<GaugeIcon className="size-4" />}
      />
    </div>
  )
}
