"use client"

import { BarList } from "@/components/tremor/bar-list"
import { useI18n } from "@/providers/i18n-provider"
import type { ErrorEndpoint, SlowEndpoint } from "@/types/monitor.types"
import { MonitorPanelHeader } from "./monitor-panel-header"

interface MonitorTopEndpointsProps {
  topSlow: SlowEndpoint[]
  topError: ErrorEndpoint[]
}

function EndpointBarList({
  title,
  description,
  rows,
  valueFormatter,
}: {
  title: string
  description: string
  rows: Array<{
    key: string
    name: string
    value: number
    meta: string
  }>
  valueFormatter: (value: number) => string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
      <MonitorPanelHeader title={title} description={description} />
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <BarList
          data={rows}
          valueFormatter={valueFormatter}
          showAnimation
          className="gap-4"
        />
      )}
    </div>
  )
}

export function MonitorTopEndpoints({ topSlow, topError }: MonitorTopEndpointsProps) {
  const { t } = useI18n()

  const slowRows = topSlow.map((e) => ({
    key: e.path,
    name: e.path,
    value: Math.round(e.avg_latency_ms),
    meta: `${t("monitor.total_count")}: ${e.request_count.toLocaleString()}`,
  }))

  const errorRows = topError.map((e) => ({
    key: e.path,
    name: e.path,
    value: e.error_count,
    meta: `${t("monitor.total_count")}: ${e.total_count.toLocaleString()}`,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <EndpointBarList
        title={t("monitor.top_slow_title")}
        description={t("monitor.top_slow_description")}
        rows={slowRows}
        valueFormatter={(value) => `${value} ms`}
      />
      <EndpointBarList
        title={t("monitor.top_error_title")}
        description={t("monitor.top_error_description")}
        rows={errorRows}
        valueFormatter={(value) => value.toLocaleString()}
      />
    </div>
  )
}
