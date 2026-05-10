"use client"

import { useState, useMemo } from "react"

import { LogListPageView } from "@/components/base/logs/log-list-page-view"
import { OperationLogsPageFilters } from "@/components/base/logs/operation-logs-page-filters"
import { createOperationLogColumns } from "@/components/base/logs/operation-logs-page-columns"
import { LogRetentionSettingsSheet } from "@/components/base/logs/log-retention-settings-sheet"
import { useI18n } from "@/providers/i18n-provider"
import type { OperationLogData } from "@/types/logs.types"
import type { PaginationState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { SettingsIcon } from "lucide-react"
import { RefreshCwIcon } from "lucide-react"

interface OperationLogsPageViewProps {
  filters: import("@/components/reui/filters").Filter<
    import("@/components/base/logs/hooks/use-operation-logs-controller").OperationLogsFilterValue
  >[]
  logs: OperationLogData[]
  total: number
  isFetching: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onFiltersChange: (
    filters: import("@/components/reui/filters").Filter<
      import("@/components/base/logs/hooks/use-operation-logs-controller").OperationLogsFilterValue
    >[]
  ) => void
  onClearFilters: () => void
  onRefresh: () => void
  onOpenDetail: (log: OperationLogData) => void
}

export function OperationLogsPageView({
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
}: OperationLogsPageViewProps) {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const columns = useMemo(
    () => createOperationLogColumns({ t, onOpenDetail }),
    [onOpenDetail, t]
  )

  const successCount = useMemo(
    () => logs.filter((log) => log.result === 1).length,
    [logs]
  )
  const moduleCount = useMemo(
    () => new Set(logs.map((log) => log.module)).size,
    [logs]
  )

  return (
    <>
      <LogListPageView
        title={t("logs.operation.page.title")}
        description={t("logs.operation.page.subtitle")}
        emptyTitle={t("logs.operation.page.emptyTitle")}
        emptyDescription={t("logs.operation.page.emptyDescription")}
        metrics={[
          {
            label: t("logs.operation.metrics.totalLabel"),
            value: total,
            hint: t("logs.operation.metrics.totalHint"),
          },
          {
            label: t("logs.operation.metrics.successLabel"),
            value: successCount,
            hint: t("logs.operation.metrics.successHint"),
            tone: successCount > 0 ? "success" : "default",
          },
          {
            label: t("logs.operation.metrics.moduleLabel"),
            value: moduleCount,
            hint: t("logs.operation.metrics.moduleHint"),
          },
        ]}
        filters={
          <OperationLogsPageFilters
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
        logType="operation_log"
      />
    </>
  )
}
