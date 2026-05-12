"use client"

import { useEffect, useState } from "react"
import { statsApi } from "@/stores/base-api"
import type { StatsGrowthData } from "@/types/stats.types"
import { useI18n } from "@/providers/i18n-provider"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"

interface Props {
  days: number
}

export function StatsGrowthContainer({ days }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<StatsGrowthData | null>(null)
  const [loadedDays, setLoadedDays] = useState<number | null>(null)
  const loading = loadedDays !== days

  useEffect(() => {
    let cancelled = false
    statsApi
      .growth({ days })
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setLoadedDays(days)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedDays(days)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  if (loading) return <SpinnerOverlay visible />
  if (!data) return null

  const cumulativeConfig: ChartConfig = {
    cumulative: {
      label: t("stats.growth.cumulative_label"),
      color: "var(--chart-1)",
    },
  }
  const dailyConfig: ChartConfig = {
    new_users: {
      label: t("stats.growth.new_users_label"),
      color: "var(--chart-3)",
    },
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Cumulative area chart */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">
          {t("stats.growth.cumulative_title")}
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("stats.growth.cumulative_description")}
        </p>
        <ChartContainer config={cumulativeConfig} className="h-60 w-full">
          <AreaChart
            data={data.items}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cumulFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.3}
                />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/40"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="var(--chart-1)"
              fill="url(#cumulFill)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Daily bar chart */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">{t("stats.growth.daily_title")}</p>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("stats.growth.daily_description")}
        </p>
        <ChartContainer config={dailyConfig} className="h-60 w-full">
          <BarChart
            data={data.items}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/40"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 11 }} width={36} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="new_users"
              fill="var(--chart-3)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
