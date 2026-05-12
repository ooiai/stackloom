"use client"

import { useEffect, useState } from "react"
import { statsApi } from "@/stores/base-api"
import type { StatsOverviewData } from "@/types/stats.types"
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

function StatKpiCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export function StatsOverviewContainer({ days }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<StatsOverviewData | null>(null)
  const [loadedDays, setLoadedDays] = useState<number | null>(null)
  const loading = loadedDays !== days

  useEffect(() => {
    let cancelled = false
    statsApi
      .overview({ days })
      .then((res) => {
        if (!cancelled) { setData(res); setLoadedDays(days) }
      })
      .catch(() => { if (!cancelled) setLoadedDays(days) })
    return () => { cancelled = true }
  }, [days])

  if (loading) return <SpinnerOverlay visible />
  if (!data) return null

  const activeChartConfig: ChartConfig = {
    dau: { label: t("stats.overview.dau_label"), color: "var(--chart-1)" },
  }
  const growthChartConfig: ChartConfig = {
    new_users: {
      label: t("stats.overview.new_users_label"),
      color: "var(--chart-3)",
    },
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatKpiCard
          label={t("stats.overview.total_users")}
          value={data.total_users}
        />
        <StatKpiCard
          label={t("stats.overview.new_users_today")}
          value={data.new_users_today}
        />
        <StatKpiCard label={t("stats.overview.dau")} value={data.dau} />
        <StatKpiCard label={t("stats.overview.wau")} value={data.wau} />
        <StatKpiCard label={t("stats.overview.mau")} value={data.mau} />
        <StatKpiCard
          label={t("stats.overview.active_tenants")}
          value={data.active_tenants}
        />
        <StatKpiCard
          label={t("stats.overview.pending_applies")}
          value={data.pending_applies}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily active users area chart */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">
            {t("stats.overview.active_trend_title")}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("stats.overview.active_trend_description")}
          </p>
          <ChartContainer config={activeChartConfig} className="h-52 w-full">
            <AreaChart
              data={data.active_users_trend}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
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
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="dau"
                stroke="var(--chart-1)"
                fill="url(#dauFill)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Daily new users bar chart */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">
            {t("stats.overview.growth_trend_title")}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("stats.overview.growth_trend_description")}
          </p>
          <ChartContainer config={growthChartConfig} className="h-52 w-full">
            <BarChart
              data={data.user_growth_trend}
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
    </div>
  )
}
