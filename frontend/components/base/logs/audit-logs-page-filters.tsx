"use client"

import { useMemo } from "react"

import {
  Filters,
  type Filter,
  type FilterFieldConfig,
  type FilterI18nConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import type { AuditLogsFilterValue } from "@/components/base/logs/hooks/use-audit-logs-controller"
import {
  FingerprintIcon,
  FunnelXIcon,
  ListFilterIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  TagIcon,
} from "lucide-react"

interface AuditLogsPageFiltersProps {
  filters: Filter<AuditLogsFilterValue>[]
  onFiltersChange: (filters: Filter<AuditLogsFilterValue>[]) => void
  onClearFilters: () => void
}

export function AuditLogsPageFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: AuditLogsPageFiltersProps) {
  const { t } = useI18n()
  const fields = useMemo<FilterFieldConfig<AuditLogsFilterValue>[]>(
    () => [
      {
        key: "trace_id",
        label: t("logs.audit.filters.traceIdLabel"),
        icon: <FingerprintIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-56",
        placeholder: t("logs.audit.filters.traceIdPlaceholder"),
      },
      {
        key: "target_type",
        label: t("logs.audit.filters.targetTypeLabel"),
        icon: <TagIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-48",
        placeholder: t("logs.audit.filters.targetTypePlaceholder"),
      },
      {
        key: "target_id",
        label: t("logs.audit.filters.targetIdLabel"),
        icon: <ScanSearchIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-48",
        placeholder: t("logs.audit.filters.targetIdPlaceholder"),
      },
      {
        key: "action",
        label: t("logs.audit.filters.actionLabel"),
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-48",
        placeholder: t("logs.audit.filters.actionPlaceholder"),
      },
      {
        key: "result",
        label: t("logs.audit.filters.resultLabel"),
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        options: [
          {
            value: "success",
            label: t("logs.common.result.success"),
          },
          {
            value: "failure",
            label: t("logs.common.result.failure"),
          },
        ],
        className: "w-36",
      },
    ],
    [t]
  )

  const i18n = useMemo<Partial<FilterI18nConfig>>(
    () => ({
      addFilter: t("logs.filters.addField"),
      searchFields: t("logs.filters.searchFields"),
    }),
    [t]
  )

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-1">
        <Filters
          filters={filters}
          fields={fields}
          showSearchInput={false}
          allowMultiple
          onChange={onFiltersChange}
          variant="default"
          size="sm"
          trigger={
            <Button variant="outline" size="sm">
              <ListFilterIcon />
              {t("common.actions.addFilter")}
            </Button>
          }
          i18n={i18n}
        />
      </div>
      {filters.length > 0 ? (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <FunnelXIcon />
          {t("common.actions.clear")}
        </Button>
      ) : null}
    </div>
  )
}
