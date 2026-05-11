"use client"

import { CpuIcon, HardDriveIcon, MemoryStickIcon, TimerIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes, formatPercent, formatUptime } from "./helpers"

interface MonitorSnapshotGridProps {
  snapshot: SystemSnapshot
}

export function MonitorSnapshotGrid({ snapshot }: MonitorSnapshotGridProps) {
  const { t } = useI18n()

  const cpuPercent = Math.round(snapshot.cpu_usage)
  const cpuCoresUsed = Math.round(snapshot.cpu_usage_cores * 10) / 10
  const memPercent = formatPercent(snapshot.memory_used, snapshot.memory_total)
  const diskPercent = formatPercent(snapshot.disk_used, snapshot.disk_total)
  const swapPercent =
    snapshot.swap_total > 0
      ? formatPercent(snapshot.swap_used, snapshot.swap_total)
      : 0

  const cpuValue = `${cpuPercent}%`
  const cpuHint = `${cpuCoresUsed} of ${snapshot.cpu_count} cores`

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.cpu")}
        value={cpuValue}
        hint={cpuHint}
        tone={cpuPercent >= 90 ? "warning" : cpuPercent >= 70 ? "warning" : "success"}
        icon={<CpuIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
      />
      <MetricCard
        label={t("monitor.memory")}
        value={`${memPercent}%`}
        hint={`${formatBytes(snapshot.memory_used)} / ${formatBytes(snapshot.memory_total)}`}
        tone={memPercent >= 90 ? "warning" : "success"}
        icon={<MemoryStickIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
        footer={t("monitor.memory_summary")}
      />
      <MetricCard
        label={t("monitor.disk")}
        value={`${diskPercent}%`}
        hint={`${formatBytes(snapshot.disk_used)} / ${formatBytes(snapshot.disk_total)}`}
        tone={diskPercent >= 90 ? "warning" : "success"}
        icon={<HardDriveIcon className="size-4" />}
        footer={t("monitor.disk_summary")}
      />
      <MetricCard
        label={t("monitor.uptime")}
        value={formatUptime(snapshot.uptime_secs)}
        hint={t("monitor.uptime_hint")}
        tone="default"
        icon={<TimerIcon className="size-4" />}
        footer={t("monitor.runtime_summary")}
      />
      {snapshot.swap_total > 0 && (
        <MetricCard
          label={t("monitor.swap")}
          value={`${swapPercent}%`}
          hint={`${formatBytes(snapshot.swap_used)} / ${formatBytes(snapshot.swap_total)}`}
          tone={swapPercent >= 80 ? "warning" : "default"}
          icon={<MemoryStickIcon className="size-4" />}
          footer={t("monitor.swap_hint")}
          className="xl:col-span-2"
        />
      )}
    </div>
  )
}
