"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes, formatSpeed } from "./helpers"
import { MonitorSparkline } from "./monitor-sparkline"

interface MonitorNetworkGridProps {
  snapshot: SystemSnapshot
  snapshotHistory?: SystemSnapshot[]
}

export function MonitorNetworkGrid({ snapshot, snapshotHistory = [] }: MonitorNetworkGridProps) {
  const { t } = useI18n()

  const rxSpeedHistory = snapshotHistory.map((s) => s.net_rx_speed)
  const txSpeedHistory = snapshotHistory.map((s) => s.net_tx_speed)

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {/* Cumulative totals */}
      <MetricCard
        label={t("monitor.net_rx")}
        value={formatBytes(snapshot.net_rx_bytes)}
        hint={t("monitor.net_rx_hint")}
        tone="default"
        icon={<ArrowDownIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.net_tx")}
        value={formatBytes(snapshot.net_tx_bytes)}
        hint={t("monitor.net_tx_hint")}
        tone="default"
        icon={<ArrowUpIcon className="size-4" />}
        className="xl:col-span-2"
      />

      {/* Real-time speed cards with sparklines */}
      <div className="xl:col-span-2 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{t("monitor.net_rx_speed")}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatSpeed(snapshot.net_rx_speed)}
            </p>
          </div>
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            <ArrowDownIcon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {t("monitor.net_speed_hint")}
        </p>
        {rxSpeedHistory.length >= 2 && (
          <div className="mt-2">
            <MonitorSparkline data={rxSpeedHistory} color="var(--chart-1)" />
          </div>
        )}
      </div>

      <div className="xl:col-span-2 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{t("monitor.net_tx_speed")}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatSpeed(snapshot.net_tx_speed)}
            </p>
          </div>
          <div className="bg-background/80 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border border-border/60">
            <ArrowUpIcon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {t("monitor.net_speed_hint")}
        </p>
        {txSpeedHistory.length >= 2 && (
          <div className="mt-2">
            <MonitorSparkline data={txSpeedHistory} color="var(--chart-3)" />
          </div>
        )}
      </div>
    </div>
  )
}
