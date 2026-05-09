"use client"

import { useMemo } from "react"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { HourlyStat } from "@/types/monitor.types"
import { formatHour } from "./helpers"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorRequestChartProps {
  hourlyStats: HourlyStat[]
}

export function MonitorRequestChart({ hourlyStats }: MonitorRequestChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    total: { label: t("monitor.requests"), color: "var(--chart-1)" },
    errors: { label: t("monitor.errors"), color: "var(--chart-2)" },
  }

  const data = useMemo(
    () =>
      hourlyStats.map((s) => ({
        hour: formatHour(s.hour),
        total: s.total,
        errors: s.errors,
      })),
    [hourlyStats]
  )

  const totalRequests = data.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.request_chart_title")}
        description={t("monitor.request_chart_description")}
        summary={`${totalRequests.toLocaleString()} ${t("monitor.requests")}`}
      />
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
