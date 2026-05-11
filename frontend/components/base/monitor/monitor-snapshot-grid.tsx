"use client"

import { CpuIcon, HardDriveIcon, MemoryStickIcon, TimerIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes, formatPercent, formatSpeed, formatUptime } from "./helpers"
import { MonitorSparkline } from "./monitor-sparkline"

interface MonitorSnapshotGridProps {
  snapshot: SystemSnapshot
  snapshotHistory?: SystemSnapshot[]
}

export function MonitorSnapshotGrid({ snapshot, snapshotHistory = [] }: MonitorSnapshotGridProps) {
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

  const cpuHistory = snapshotHistory.map((s) => Math.round(s.cpu_usage))
  const memHistory = snapshotHistory.map((s) => formatPercent(s.memory_used, s.memory_total))
  const diskHistory = snapshotHistory.map((s) => formatPercent(s.disk_used, s.disk_total))

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <div className="xl:col-span-2 rounded-2xl border border-border/70 bg-emerald-500/8 p-5 shadow-sm backdrop-blur transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{t("monitor.cpu")}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {cpuValue}
            </p>
          </div>
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            <CpuIcon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{cpuHint}</p>
        {cpuHistory.length >= 2 && (
          <div className="mt-2">
            <MonitorSparkline data={cpuHistory} color="var(--chart-1)" />
          </div>
        )}
      </div>

      <div className="xl:col-span-2 rounded-2xl border border-border/70 bg-emerald-500/8 p-5 shadow-sm backdrop-blur transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{t("monitor.memory")}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {`${memPercent}%`}
            </p>
          </div>
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            <MemoryStickIcon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {`${formatBytes(snapshot.memory_used)} / ${formatBytes(snapshot.memory_total)}`}
        </p>
        {memHistory.length >= 2 && (
          <div className="mt-2">
            <MonitorSparkline data={memHistory} color="var(--chart-3)" />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{t("monitor.disk")}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {`${diskPercent}%`}
            </p>
          </div>
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            <HardDriveIcon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {`${formatBytes(snapshot.disk_used)} / ${formatBytes(snapshot.disk_total)}`}
        </p>
        {diskHistory.length >= 2 && (
          <div className="mt-2">
            <MonitorSparkline data={diskHistory} color="var(--chart-4)" />
          </div>
        )}
      </div>

      <MetricCard
        label={t("monitor.uptime")}
        value={formatUptime(snapshot.uptime_secs)}
        hint={t("monitor.uptime_hint")}
        tone="default"
        icon={<TimerIcon className="size-4" />}
        footer={t("monitor.runtime_summary")}
      />

      {snapshot.disk_read_speed > 0 || snapshot.disk_write_speed > 0 ? (
        <MetricCard
          label={t("monitor.disk_read_speed")}
          value={formatSpeed(snapshot.disk_read_speed)}
          hint={`${t("monitor.disk_write_speed")}: ${formatSpeed(snapshot.disk_write_speed)}`}
          tone="default"
          icon={<HardDriveIcon className="size-4" />}
          className="xl:col-span-2"
        />
      ) : null}

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
