"use client"

import { ActivityIcon, GaugeIcon, TimerIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { AppStats } from "@/types/monitor.types"

interface MonitorAppStatsGridProps {
  appStats: AppStats
}

export function MonitorAppStatsGrid({ appStats }: MonitorAppStatsGridProps) {
  const { t } = useI18n()

  const successRateRounded = Math.round(appStats.success_rate * 10) / 10

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.success_rate")}
        value={`${successRateRounded}%`}
        hint={t("monitor.success_rate_hint")}
        tone={successRateRounded >= 99 ? "success" : successRateRounded >= 95 ? "warning" : "warning"}
        icon={<ActivityIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
        footer={t("monitor.success_rate_summary")}
      />
      <MetricCard
        label={t("monitor.p95_latency")}
        value={`${Math.round(appStats.p95_latency_ms)} ms`}
        hint={t("monitor.p95_latency_hint")}
        tone={appStats.p95_latency_ms >= 500 ? "warning" : "default"}
        icon={<TimerIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.p99_latency")}
        value={`${Math.round(appStats.p99_latency_ms)} ms`}
        hint={t("monitor.p99_latency_hint")}
        tone={appStats.p99_latency_ms >= 1000 ? "warning" : "default"}
        icon={<GaugeIcon className="size-4" />}
        className="xl:col-span-2"
      />
    </div>
  )
}
