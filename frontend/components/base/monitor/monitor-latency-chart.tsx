"use client"

import { useMemo } from "react"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { HourlyStat } from "@/types/monitor.types"
import { formatHour } from "./helpers"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorLatencyChartProps {
  hourlyStats: HourlyStat[]
}

export function MonitorLatencyChart({ hourlyStats }: MonitorLatencyChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    avg_latency_ms: { label: t("monitor.latency_ms"), color: "var(--chart-3)" },
  }

  const data = useMemo(
    () =>
      hourlyStats.map((s) => ({
        hour: formatHour(s.hour),
        avg_latency_ms: Math.round(s.avg_latency_ms),
      })),
    [hourlyStats]
  )

  const peakLatency = data.reduce(
    (max, item) => (item.avg_latency_ms > max ? item.avg_latency_ms : max),
    0
  )

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.latency_chart_title")}
        description={t("monitor.latency_chart_description")}
        summary={`${peakLatency} ms peak`}
      />
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            unit="ms"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="avg_latency_ms" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
