"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { DatabaseStats } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorDbRowsChartProps {
  databaseStats: DatabaseStats
}

export function MonitorDbRowsChart({ databaseStats }: MonitorDbRowsChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    count: { label: t("monitor.db_rows_chart_title"), color: "var(--chart-1)" },
  }

  const data = [
    { label: t("monitor.db_rows_returned"), count: databaseStats.rows_returned, fill: "var(--chart-1)" },
    { label: t("monitor.db_rows_fetched"), count: databaseStats.rows_fetched, fill: "var(--chart-1)" },
    { label: t("monitor.db_rows_inserted"), count: databaseStats.rows_inserted, fill: "var(--chart-3)" },
    { label: t("monitor.db_rows_updated"), count: databaseStats.rows_updated, fill: "var(--chart-3)" },
    { label: t("monitor.db_rows_deleted"), count: databaseStats.rows_deleted, fill: "var(--chart-2)" },
  ]

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.db_rows_chart_title")}
        description={t("monitor.db_rows_chart_description")}
        summary={total.toLocaleString()}
      />
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [(value as number).toLocaleString(), ""]}
              />
            }
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
