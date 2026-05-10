"use client"

import { useState, useMemo } from "react"

import { createSystemLogColumns } from "@/components/base/logs/system-logs-page-columns"
import { SystemLogsPageFilters } from "@/components/base/logs/system-logs-page-filters"
import { LogListPageView } from "@/components/base/logs/log-list-page-view"
import { LogRetentionSettingsSheet } from "@/components/base/logs/log-retention-settings-sheet"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemLogData } from "@/types/logs.types"
import type { PaginationState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { SettingsIcon } from "lucide-react"
import { RefreshCwIcon } from "lucide-react"

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const columns = useMemo(
    () => createSystemLogColumns({ t, onOpenDetail }),
    [onOpenDetail, t]
  )

  const failureCount = useMemo(
    () =>
      logs.filter((log) => log.result.trim().toLowerCase() === "failure")
        .length,
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
    <>
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
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
            >
              <RefreshCwIcon
                className={isFetching ? "animate-spin" : undefined}
              />
              {t("common.actions.refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon />
              {t("logs.settings")}
            </Button>
          </div>
        }
      />
      <LogRetentionSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        logType="system_log"
      />
    </>
  )
}
