"use client"

import { useI18n } from "@/providers/i18n-provider"
import type { DatabaseStats, DatabaseTopQuery } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorDatabaseTopQueriesProps {
  databaseStats: DatabaseStats
}

function QueryTable({
  title,
  rows,
  mode,
}: {
  title: string
  rows: DatabaseTopQuery[]
  mode: "total" | "mean"
}) {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader
        title={title}
        description={t("monitor.db_top_queries_description")}
      />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="pb-2 text-left font-medium text-muted-foreground">
                {t("monitor.db_query")}
              </th>
              <th className="pb-2 text-right font-medium text-muted-foreground">
                {mode === "total" ? t("monitor.db_total_time") : t("monitor.db_mean_time")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${mode}-${index}`} className="border-b border-border/30 last:border-0">
                <td className="max-w-[420px] py-1.5 pr-2 text-foreground/80" title={row.query}>
                  <div className="line-clamp-2">{row.query}</div>
                </td>
                <td className="py-1.5 text-right">
                  <span className="font-medium">
                    {Math.round(
                      mode === "total" ? row.total_exec_time_ms : row.mean_exec_time_ms
                    )}{" "}
                    ms
                  </span>
                  <div className="text-muted-foreground">
                    {t("monitor.db_calls")}: {row.calls.toLocaleString()} · {t("monitor.db_rows")}:{" "}
                    {row.rows.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function MonitorDatabaseTopQueries({
  databaseStats,
}: MonitorDatabaseTopQueriesProps) {
  const { t } = useI18n()
  const pgss = databaseStats.pg_stat_statements

  if (!pgss.available) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
        <MonitorPanelHeader
          title={t("monitor.db_top_queries_title")}
          description={t("monitor.db_top_queries_disabled")}
        />
        <p className="mt-2">
          {pgss.unavailable_reason_key
            ? t(pgss.unavailable_reason_key)
            : t("monitor.db_pgss_query_failed")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <QueryTable
        title={t("monitor.db_top_queries_total")}
        rows={pgss.top_by_total_time}
        mode="total"
      />
      <QueryTable
        title={t("monitor.db_top_queries_mean")}
        rows={pgss.top_by_mean_time}
        mode="mean"
      />
    </div>
  )
}
