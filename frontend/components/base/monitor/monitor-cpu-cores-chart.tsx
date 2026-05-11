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
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorCpuCoresChartProps {
  snapshot: SystemSnapshot
}

function coreColor(usage: number): string {
  if (usage >= 80) return "var(--chart-2)"
  if (usage >= 60) return "var(--chart-4)"
  return "var(--chart-1)"
}

export function MonitorCpuCoresChart({ snapshot }: MonitorCpuCoresChartProps) {
  const { t } = useI18n()

  const chartConfig: ChartConfig = {
    usage: { label: "%", color: "var(--chart-1)" },
  }

  const data = snapshot.per_core_usage.map((usage, idx) => ({
    core: `${t("monitor.core")}${idx}`,
    usage: Math.round(usage),
  }))

  const maxUsage = Math.max(...data.map((d) => d.usage), 0)

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.cpu_cores_chart_title")}
        description={t("monitor.cpu_cores_chart_description")}
        summary={`${t("monitor.cpu")} ${maxUsage}% peak`}
      />
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
          <XAxis
            dataKey="core"
            tick={{ fontSize: 10 }}
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
            content={<ChartTooltipContent hideLabel={false} />}
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Bar dataKey="usage" radius={[3, 3, 0, 0]} maxBarSize={24}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={coreColor(entry.usage)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
