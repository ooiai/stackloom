"use client"

import { useEffect, useState } from "react"
import { statsApi } from "@/stores/base-api"
import type { StatsFunnelData } from "@/types/stats.types"
import { useI18n } from "@/providers/i18n-provider"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
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

const STEP_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
]

export function StatsFunnelContainer({ days }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<StatsFunnelData | null>(null)
  const [loadedDays, setLoadedDays] = useState<number | null>(null)
  const loading = loadedDays !== days

  useEffect(() => {
    let cancelled = false
    statsApi
      .funnel({ days })
      .then((res) => {
        if (!cancelled) { setData(res); setLoadedDays(days) }
      })
      .catch(() => { if (!cancelled) setLoadedDays(days) })
    return () => { cancelled = true }
  }, [days])

  if (loading) return <SpinnerOverlay visible />
  if (!data || data.steps.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        {t("stats.funnel.no_data")}
      </div>
    )
  }

  const chartConfig: ChartConfig = {
    count: { label: t("stats.funnel.count_label"), color: "var(--chart-1)" },
  }

  const localizedStepNames: Record<string, string> = {
    registered: t("stats.funnel.step_registered"),
    logged_in: t("stats.funnel.step_logged_in"),
    operated: t("stats.funnel.step_operated"),
    activated: t("stats.funnel.step_activated"),
  }

  const chartData = data.steps.map((step) => ({
    ...step,
    name: localizedStepNames[step.step] ?? step.step,
  }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">{t("stats.funnel.title")}</p>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("stats.funnel.description")}
        </p>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/40"
              vertical={false}
            />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={STEP_COLORS[idx % STEP_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Funnel step details table */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  步骤
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                  {t("stats.funnel.count_label")}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                  {t("stats.funnel.rate_label")}
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((step, idx) => (
                <tr
                  key={step.step}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-2.5 text-sm font-medium">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: STEP_COLORS[idx % STEP_COLORS.length],
                      }}
                    />
                    {step.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                    {step.count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                    {(step.rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
