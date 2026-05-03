"use client"

import { useMemo } from "react"

import { createSystemLogColumns } from "@/components/base/logs/system-logs-page-columns"
import { SystemLogsPageFilters } from "@/components/base/logs/system-logs-page-filters"
import { LogListPageView } from "@/components/base/logs/log-list-page-view"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemLogData } from "@/types/logs.types"
import type { PaginationState } from "@tanstack/react-table"

interface SystemLogsPageViewProps {
  filters: import("@/components/reui/filters").Filter<
    import("@/components/base/logs/hooks/use-system-logs-controller").SystemLogsFilterValue
  >[]
  logs: SystemLogData[]
  total: number
  isFetching: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onFiltersChange: (
    filters: import("@/components/reui/filters").Filter<
      import("@/components/base/logs/hooks/use-system-logs-controller").SystemLogsFilterValue
    >[]
  ) => void
  onClearFilters: () => void
  onRefresh: () => void
  onOpenDetail: (log: SystemLogData) => void
}

export function SystemLogsPageView({
  filters,
  logs,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onOpenDetail,
}: SystemLogsPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () => createSystemLogColumns({ t, onOpenDetail }),
    [onOpenDetail, t]
  )

  const failureCount = useMemo(
    () =>
      logs.filter((log) => log.result.trim().toLowerCase() === "failure").length,
    [logs]
  )
  const averageLatency = useMemo(() => {
    if (logs.length === 0) {
      return 0
    }

    const totalLatency = logs.reduce((sum, log) => sum + log.latency_ms, 0)
    return Math.round(totalLatency / logs.length)
  }, [logs])

  return (
    <LogListPageView
      title={t("logs.system.page.title")}
      description={t("logs.system.page.subtitle")}
      emptyTitle={t("logs.system.page.emptyTitle")}
      emptyDescription={t("logs.system.page.emptyDescription")}
      metrics={[
        {
          label: t("logs.system.metrics.totalLabel"),
          value: total,
          hint: t("logs.system.metrics.totalHint"),
        },
        {
          label: t("logs.system.metrics.failureLabel"),
          value: failureCount,
          hint: t("logs.system.metrics.failureHint"),
          tone: failureCount > 0 ? "warning" : "success",
        },
        {
          label: t("logs.system.metrics.latencyLabel"),
          value: `${averageLatency} ms`,
          hint: t("logs.system.metrics.latencyHint"),
        },
      ]}
      filters={
        <SystemLogsPageFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
        />
      }
      columns={columns}
      items={logs}
      total={total}
      isFetching={isFetching}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      onRefresh={onRefresh}
    />
  )
}
