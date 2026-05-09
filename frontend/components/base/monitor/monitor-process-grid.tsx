"use client"

import { CpuIcon, MemoryStickIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes } from "./helpers"

interface MonitorProcessGridProps {
  snapshot: SystemSnapshot
}

export function MonitorProcessGrid({ snapshot }: MonitorProcessGridProps) {
  const { t } = useI18n()

  const processCpuPercent = Math.round(snapshot.process_cpu_percent)
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.process_memory")}
        value={formatBytes(snapshot.process_memory_bytes)}
        hint={t("monitor.process_memory_hint")}
        tone="default"
        icon={<MemoryStickIcon className="size-4" />}
        className="xl:col-span-2"
        footer={t("monitor.process_memory_summary")}
      />
      <MetricCard
        label={t("monitor.process_virtual_memory")}
        value={formatBytes(snapshot.process_virtual_memory_bytes)}
        hint={t("monitor.process_virtual_memory_hint")}
        tone="default"
        icon={<MemoryStickIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.process_cpu")}
        value={`${processCpuPercent}%`}
        hint={t("monitor.process_cpu_hint")}
        tone={processCpuPercent >= 80 ? "warning" : "success"}
        icon={<CpuIcon className="size-4" />}
        className="xl:col-span-2"
        size="hero"
        footer={t("monitor.process_cpu_summary")}
      />
    </div>
  )
}
