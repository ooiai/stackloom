"use client"

import { GpuIcon, MonitorIcon, ZapIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { GpuStats } from "@/types/monitor.types"
import { formatBytes } from "./helpers"

interface MonitorGpuGridProps {
  gpuStats: GpuStats
}

export function MonitorGpuGrid({ gpuStats }: MonitorGpuGridProps) {
  const { t } = useI18n()

  if (!gpuStats.available || gpuStats.devices.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <MetricCard
          label={t("monitor.gpu_group")}
          value={t("monitor.gpu_no_gpu")}
          hint={t("monitor.gpu_no_gpu_hint")}
          tone="default"
          icon={<MonitorIcon className="size-4" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gpuStats.devices.map((device) => {
        const memPercent =
          device.memory_total_bytes > 0
            ? Math.round((device.memory_used_bytes / device.memory_total_bytes) * 100)
            : 0

        const tempTone =
          device.temperature_celsius != null
            ? device.temperature_celsius >= 85
              ? "warning"
              : device.temperature_celsius >= 70
                ? "warning"
                : "default"
            : "default"

        return (
          <div key={device.index} className="grid grid-cols-2 gap-4 xl:grid-cols-6">
            <MetricCard
              label={`GPU ${device.index} · ${t("monitor.gpu_utilization")}`}
              value={`${device.utilization_gpu}%`}
              hint={device.name}
              tone={device.utilization_gpu >= 90 ? "warning" : "default"}
              icon={<MonitorIcon className="size-4" />}
              className="xl:col-span-2"
              size="hero"
            />
            <MetricCard
              label={t("monitor.gpu_memory")}
              value={`${memPercent}%`}
              hint={`${formatBytes(device.memory_used_bytes)} / ${formatBytes(device.memory_total_bytes)}`}
              tone={memPercent >= 90 ? "warning" : "default"}
              icon={<GpuIcon className="size-4" />}
              className="xl:col-span-2"
              size="hero"
            />
            {device.temperature_celsius != null && (
              <MetricCard
                label={t("monitor.gpu_temperature")}
                value={`${device.temperature_celsius}°C`}
                hint={`P-State: ${device.pstate ?? "N/A"}`}
                tone={tempTone}
                icon={<ZapIcon className="size-4" />}
              />
            )}
            {device.power_usage_watts != null && (
              <MetricCard
                label={t("monitor.gpu_power")}
                value={`${device.power_usage_watts.toFixed(0)} W`}
                hint={
                  device.power_limit_watts != null
                    ? `${t("monitor.gpu_power_limit")}: ${device.power_limit_watts.toFixed(0)} W`
                    : ""
                }
                tone={
                  device.power_limit_watts != null &&
                  device.power_usage_watts / device.power_limit_watts >= 0.9
                    ? "warning"
                    : "default"
                }
                icon={<ZapIcon className="size-4" />}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
