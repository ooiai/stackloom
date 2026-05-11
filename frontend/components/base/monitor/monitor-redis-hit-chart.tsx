"use client"

import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useI18n } from "@/providers/i18n-provider"
import type { RedisStats } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorRedisHitChartProps {
  redisStats: RedisStats
}

export function MonitorRedisHitChart({ redisStats }: MonitorRedisHitChartProps) {
  const { t } = useI18n()

  const hits = redisStats.keyspace_hits
  const misses = redisStats.keyspace_misses
  const total = hits + misses
  const hitRate = total > 0 ? Math.round((hits / total) * 100) : 100

  const chartConfig: ChartConfig = {
    hits: { label: t("monitor.redis_hit_label"), color: "var(--chart-1)" },
    misses: { label: t("monitor.redis_miss_label"), color: "var(--chart-2)" },
  }

  const data = [
    { name: "hits", value: hits || (total === 0 ? 1 : 0), label: t("monitor.redis_hit_label") },
    { name: "misses", value: misses, label: t("monitor.redis_miss_label") },
  ]

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={t("monitor.redis_hit_chart_title")}
        description={t("monitor.redis_hit_chart_description")}
        summary={`${hitRate}%`}
      />
      <ChartContainer config={chartConfig} className="mx-auto h-48 w-full max-w-xs">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="label"
                formatter={(value) => [(value as number).toLocaleString(), ""]}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            strokeWidth={2}
          >
            <Cell fill="var(--chart-1)" />
            <Cell fill="var(--chart-2)" />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
