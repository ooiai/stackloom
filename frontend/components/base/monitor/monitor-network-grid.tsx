"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes } from "./helpers"

interface MonitorNetworkGridProps {
  snapshot: SystemSnapshot
}

export function MonitorNetworkGrid({ snapshot }: MonitorNetworkGridProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
    </div>
  )
}
