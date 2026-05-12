"use client"

import { useEffect, useState } from "react"
import { statsApi } from "@/stores/base-api"
import type { StatsBehaviorData } from "@/types/stats.types"
import { useI18n } from "@/providers/i18n-provider"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const MODULE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function StatsBehaviorContainer({ days }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<StatsBehaviorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    statsApi.behavior({ days }).then((res) => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [days])

  if (loading) return <SpinnerOverlay visible />
  if (!data) return null

  const moduleChartConfig: ChartConfig = {
    count: { label: t("stats.behavior.count_label"), color: "var(--chart-1)" },
  }
  const trendChartConfig: ChartConfig = {
    count: { label: t("stats.behavior.count_label"), color: "var(--chart-2)" },
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Operations by module horizontal bar chart */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">{t("stats.behavior.by_module_title")}</p>
          <p className="mb-4 text-xs text-muted-foreground">{t("stats.behavior.by_module_description")}</p>
          <ChartContainer config={moduleChartConfig} className="h-60 w-full">
            <BarChart
              layout="vertical"
              data={data.operation_by_module}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="module" tick={{ fontSize: 11 }} width={72} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {data.operation_by_module.map((_, idx) => (
                  <Cell key={idx} fill={MODULE_COLORS[idx % MODULE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Daily operation trend area chart */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">{t("stats.behavior.daily_trend_title")}</p>
          <p className="mb-4 text-xs text-muted-foreground">{t("stats.behavior.daily_trend_description")}</p>
          <ChartContainer config={trendChartConfig} className="h-60 w-full">
            <AreaChart data={data.daily_trend} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="opsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--chart-2)"
                fill="url(#opsFill)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Top operators table */}
      {data.top_operators.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold">{t("stats.behavior.top_operators_title")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                    {t("stats.behavior.operator")}
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                    {t("stats.behavior.operations")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_operators.map((op, idx) => (
                  <tr key={op.operator_id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{op.operator_name || op.operator_id}</td>
                    <td className="px-4 py-2.5 text-right text-sm tabular-nums">{op.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
