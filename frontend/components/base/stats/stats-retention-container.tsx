"use client"

import { useEffect, useState } from "react"
import { statsApi } from "@/stores/base-api"
import type { RetentionCohort, StatsRetentionData } from "@/types/stats.types"
import { useI18n } from "@/providers/i18n-provider"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { cn } from "@/lib/utils"

interface Props {
  days: number
}

function retentionColor(rate: number | null): string {
  if (rate === null) return "bg-muted/30 text-muted-foreground"
  if (rate >= 0.5) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
  if (rate >= 0.3) return "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
  if (rate >= 0.1) return "bg-orange-400/20 text-orange-700 dark:text-orange-300"
  return "bg-red-400/20 text-red-700 dark:text-red-300"
}

function fmtRate(rate: number | null): string {
  if (rate === null) return "—"
  return `${(rate * 100).toFixed(1)}%`
}

function CohortRow({ cohort, t }: { cohort: RetentionCohort; t: (k: string) => string }) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-4 py-2.5 text-sm font-medium">{cohort.cohort_date}</td>
      <td className="px-4 py-2.5 text-sm tabular-nums">{cohort.new_users}</td>
      <td className={cn("px-4 py-2.5 text-center text-sm font-medium tabular-nums rounded", retentionColor(cohort.d1_rate))}>
        {fmtRate(cohort.d1_rate)}
      </td>
      <td className={cn("px-4 py-2.5 text-center text-sm font-medium tabular-nums rounded", retentionColor(cohort.d7_rate))}>
        {fmtRate(cohort.d7_rate)}
      </td>
      <td className={cn("px-4 py-2.5 text-center text-sm font-medium tabular-nums rounded", retentionColor(cohort.d30_rate))}>
        {fmtRate(cohort.d30_rate)}
      </td>
    </tr>
  )
}

export function StatsRetentionContainer({ days }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<StatsRetentionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    statsApi.retention({ days }).then((res) => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [days])

  if (loading) return <SpinnerOverlay visible />
  if (!data || data.cohorts.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        {t("stats.retention.no_data")}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <p className="text-sm font-semibold">{t("stats.retention.title")}</p>
        <p className="text-xs text-muted-foreground">{t("stats.retention.description")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/40">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                {t("stats.retention.cohort_date")}
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                {t("stats.retention.new_users")}
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                {t("stats.retention.d1_rate")}
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                {t("stats.retention.d7_rate")}
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                {t("stats.retention.d30_rate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((cohort) => (
              <CohortRow key={cohort.cohort_date} cohort={cohort} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
