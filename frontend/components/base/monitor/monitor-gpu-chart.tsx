"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { GpuStats } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorGpuChartProps {
  gpuStats: GpuStats
}

export function MonitorGpuChart({ gpuStats }: MonitorGpuChartProps) {
  const { t } = useI18n()

  if (!gpuStats.available || gpuStats.devices.length === 0) return null

  const chartConfig: ChartConfig = {
    utilization: {
      label: t("monitor.gpu_utilization"),
      color: "var(--chart-1)",
    },
    memory: {
      label: t("monitor.gpu_mem_usage"),
      color: "var(--chart-3)",
    },
  }

  const data = gpuStats.devices.map((d) => {
    const memPercent =
      d.memory_total_bytes > 0
        ? Math.round((d.memory_used_bytes / d.memory_total_bytes) * 100)
        : 0
    return {
      name: gpuStats.devices.length === 1 ? d.name : `GPU ${d.index}`,
      utilization: d.utilization_gpu,
      memory: memPercent,
    }
  })

  const maxUtil = Math.max(...gpuStats.devices.map((d) => d.utilization_gpu), 0)
  const maxMemPct = Math.max(
    ...gpuStats.devices.map((d) =>
      d.memory_total_bytes > 0
        ? Math.round((d.memory_used_bytes / d.memory_total_bytes) * 100)
        : 0
    ),
    0
  )

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.gpu_chart_title")}
        description={t("monitor.gpu_chart_description")}
        summary={`${t("monitor.gpu_utilization")} ${maxUtil}% · ${t("monitor.gpu_mem_usage")} ${maxMemPct}%`}
      />
      <ChartContainer config={chartConfig} className="h-52 w-full">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
            unit="%"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [`${value}%`, name as string]}
              />
            }
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="utilization" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList dataKey="utilization" position="top" fontSize={11} formatter={(v: unknown) => `${v}%`} />
          </Bar>
          <Bar dataKey="memory" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList dataKey="memory" position="top" fontSize={11} formatter={(v: unknown) => `${v}%`} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
