"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemSnapshot } from "@/types/monitor.types"
import { formatBytes } from "./helpers"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorNetworkChartProps {
  snapshot: SystemSnapshot
}

export function MonitorNetworkChart({ snapshot }: MonitorNetworkChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    bytes: { label: t("monitor.net_rx_label"), color: "var(--chart-1)" },
  }

  const data = [
    { label: t("monitor.net_rx_label"), bytes: snapshot.net_rx_bytes, fill: "var(--chart-1)" },
    { label: t("monitor.net_tx_label"), bytes: snapshot.net_tx_bytes, fill: "var(--chart-3)" },
  ]

  const total = snapshot.net_rx_bytes + snapshot.net_tx_bytes

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.net_chart_title")}
        description={t("monitor.net_chart_description")}
        summary={formatBytes(total)}
      />
      <ChartContainer config={chartConfig} className="h-40 w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatBytes(v)}
            width={60}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [formatBytes(value as number), ""]}
              />
            }
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Bar dataKey="bytes" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
