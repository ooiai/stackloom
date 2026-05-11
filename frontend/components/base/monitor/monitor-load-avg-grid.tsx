"use client"

import { ActivityIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"

interface MonitorLoadAvgGridProps {
  snapshot: SystemSnapshot
}

export function MonitorLoadAvgGrid({ snapshot }: MonitorLoadAvgGridProps) {
  const { t } = useI18n()

  const loadTone = (load: number) => (load > snapshot.cpu_count ? "warning" : "default")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        label={t("monitor.load_avg_1")}
        value={snapshot.load_avg_1.toFixed(2)}
        hint={t("monitor.load_avg_hint")}
        tone={loadTone(snapshot.load_avg_1)}
        icon={<ActivityIcon className="size-4" />}
      />
      <MetricCard
        label={t("monitor.load_avg_5")}
        value={snapshot.load_avg_5.toFixed(2)}
        hint={t("monitor.load_avg_hint")}
        tone={loadTone(snapshot.load_avg_5)}
        icon={<ActivityIcon className="size-4" />}
      />
      <MetricCard
        label={t("monitor.load_avg_15")}
        value={snapshot.load_avg_15.toFixed(2)}
        hint={t("monitor.load_avg_hint")}
        tone={loadTone(snapshot.load_avg_15)}
        icon={<ActivityIcon className="size-4" />}
      />
    </div>
  )
}
