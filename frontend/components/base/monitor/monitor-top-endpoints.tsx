"use client"

import { useI18n } from "@/providers/i18n-provider"
import type { ErrorEndpoint, SlowEndpoint } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorTopEndpointsProps {
  topSlow: SlowEndpoint[]
  topError: ErrorEndpoint[]
}

function EndpointTable({
  title,
  description,
  rows,
  col1Label,
  col1Value,
}: {
  title: string
  description: string
  rows: { path: string; value: string; sub: string }[]
  col1Label: string
  col1Value: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader title={title} description={description} />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="pb-2 text-left font-medium text-muted-foreground">{col1Label}</th>
              <th className="pb-2 text-right font-medium text-muted-foreground">{col1Value}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/30 last:border-0">
                <td className="py-1.5 pr-2 max-w-[160px] truncate text-foreground/80" title={r.path}>
                  {r.path}
                </td>
                <td className="py-1.5 text-right">
                  <span className="font-medium">{r.value}</span>
                  <div className="text-muted-foreground">{r.sub}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function MonitorTopEndpoints({ topSlow, topError }: MonitorTopEndpointsProps) {
  const { t } = useI18n()

  const slowRows = topSlow.map((e) => ({
    path: e.path,
    value: `${Math.round(e.avg_latency_ms)} ms`,
    sub: `(${e.request_count})`,
  }))

  const errorRows = topError.map((e) => ({
    path: e.path,
    value: String(e.error_count),
    sub: `/ ${e.total_count}`,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <EndpointTable
        title={t("monitor.top_slow_title")}
        description={t("monitor.top_slow_description")}
        rows={slowRows}
        col1Label={t("monitor.endpoint")}
        col1Value={t("monitor.avg_latency")}
      />
      <EndpointTable
        title={t("monitor.top_error_title")}
        description={t("monitor.top_error_description")}
        rows={errorRows}
        col1Label={t("monitor.endpoint")}
        col1Value={t("monitor.error_count")}
      />
    </div>
  )
}
