"use client"

import { ThermometerIcon, Zap } from "lucide-react"

import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { MonitorCpuCoresChart } from "./monitor-cpu-cores-chart"

interface MonitorCpuCoresGridProps {
  snapshot: SystemSnapshot
}

export function MonitorCpuCoresGrid({ snapshot }: MonitorCpuCoresGridProps) {
  const { t } = useI18n()

  if (!snapshot.per_core_usage || snapshot.per_core_usage.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <MonitorCpuCoresChart snapshot={snapshot} />

      {/* CPU Temperature */}
      {snapshot.cpu_temp_celsius !== null && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ThermometerIcon className="size-4" />
            {t("monitor.cpu_temperature")}
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(snapshot.cpu_temp_celsius * 10) / 10}°C
            </span>
            <span
              className={`text-sm font-medium ${
                snapshot.cpu_temp_celsius >= 80
                  ? "text-red-600 dark:text-red-400"
                  : snapshot.cpu_temp_celsius >= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-green-600 dark:text-green-400"
              }`}
            >
              {snapshot.cpu_temp_celsius >= 80
                ? t("monitor.temperature_high")
                : snapshot.cpu_temp_celsius >= 60
                  ? t("monitor.temperature_moderate")
                  : t("monitor.temperature_normal")}
            </span>
          </div>
        </div>
      )}

      {/* CPU Frequency */}
      {snapshot.cpu_freq_mhz && snapshot.cpu_freq_mhz.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Zap className="size-4" />
            {t("monitor.cpu_frequency")}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {snapshot.cpu_freq_mhz.slice(0, 8).map((freq, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded bg-gray-50 p-3 dark:bg-gray-800"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t("monitor.core")} {idx}
                </span>
                <span className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {(freq / 1000).toFixed(2)} GHz
                </span>
              </div>
            ))}
          </div>
          {snapshot.cpu_freq_mhz.length > 8 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t("monitor.showing_first_8_cores")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
