"use client"

import { useState, useMemo } from "react"

import { LogListPageView } from "@/components/base/logs/log-list-page-view"
import { AuditLogsPageFilters } from "@/components/base/logs/audit-logs-page-filters"
import { createAuditLogColumns } from "@/components/base/logs/audit-logs-page-columns"
import { LogRetentionSettingsSheet } from "@/components/base/logs/log-retention-settings-sheet"
import { useI18n } from "@/providers/i18n-provider"
import type { AuditLogData } from "@/types/logs.types"
import type { PaginationState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { SettingsIcon } from "lucide-react"
import { RefreshCwIcon } from "lucide-react"

interface AuditLogsPageViewProps {
  filters: import("@/components/reui/filters").Filter<
    import("@/components/base/logs/hooks/use-audit-logs-controller").AuditLogsFilterValue
  >[]
  logs: AuditLogData[]
  total: number
  isFetching: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onFiltersChange: (
    filters: import("@/components/reui/filters").Filter<
      import("@/components/base/logs/hooks/use-audit-logs-controller").AuditLogsFilterValue
    >[]
  ) => void
  onClearFilters: () => void
  onRefresh: () => void
  onOpenDetail: (log: AuditLogData) => void
}

export function AuditLogsPageView({
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
}: AuditLogsPageViewProps) {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const columns = useMemo(
    () => createAuditLogColumns({ t, onOpenDetail }),
    [onOpenDetail, t]
  )

  const failureCount = useMemo(
    () =>
      logs.filter((log) => log.result.trim().toLowerCase() === "failure")
        .length,
    [logs]
  )
  const uniqueTargetCount = useMemo(
    () =>
      new Set(logs.map((log) => `${log.target_type}:${log.target_id}`)).size,
    [logs]
  )

  return (
    <>
      <LogListPageView
        title={t("logs.audit.page.title")}
        description={t("logs.audit.page.subtitle")}
        emptyTitle={t("logs.audit.page.emptyTitle")}
        emptyDescription={t("logs.audit.page.emptyDescription")}
        metrics={[
          {
            label: t("logs.audit.metrics.totalLabel"),
            value: total,
            hint: t("logs.audit.metrics.totalHint"),
          },
          {
            label: t("logs.audit.metrics.failureLabel"),
            value: failureCount,
            hint: t("logs.audit.metrics.failureHint"),
            tone: failureCount > 0 ? "warning" : "success",
          },
          {
            label: t("logs.audit.metrics.targetLabel"),
            value: uniqueTargetCount,
            hint: t("logs.audit.metrics.targetHint"),
          },
        ]}
        filters={
          <AuditLogsPageFilters
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
        logType="audit_log"
      />
    </>
  )
}
