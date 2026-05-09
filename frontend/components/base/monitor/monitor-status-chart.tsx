"use client"

import { useMemo } from "react"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { StatusDistribution } from "@/types/monitor.types"
import { formatHour } from "./helpers"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorStatusChartProps {
  statusDistribution: StatusDistribution[]
}

export function MonitorStatusChart({ statusDistribution }: MonitorStatusChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    ok_2xx: { label: t("monitor.ok_2xx"), color: "var(--chart-1)" },
    err_4xx: { label: t("monitor.err_4xx"), color: "var(--chart-4)" },
    err_5xx: { label: t("monitor.err_5xx"), color: "var(--chart-2)" },
  }

  const data = useMemo(
    () =>
      statusDistribution.map((d) => ({
        hour: formatHour(d.hour),
        ok_2xx: d.ok_2xx,
        err_4xx: d.err_4xx,
        err_5xx: d.err_5xx,
      })),
    [statusDistribution]
  )

  const errorTotal = data.reduce((sum, item) => sum + item.err_4xx + item.err_5xx, 0)

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.status_distribution_title")}
        description={t("monitor.status_chart_description")}
        summary={`${errorTotal.toLocaleString()} ${t("monitor.errors")}`}
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
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="ok_2xx" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="err_4xx" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="err_5xx" stackId="a" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
