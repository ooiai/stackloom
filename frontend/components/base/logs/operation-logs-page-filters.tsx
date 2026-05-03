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
import type { OperationLogsFilterValue } from "@/components/base/logs/hooks/use-operation-logs-controller"
import {
  FingerprintIcon,
  FunnelXIcon,
  ListFilterIcon,
  SearchIcon,
  TagIcon,
  WaypointsIcon,
} from "lucide-react"

interface OperationLogsPageFiltersProps {
  filters: Filter<OperationLogsFilterValue>[]
  onFiltersChange: (filters: Filter<OperationLogsFilterValue>[]) => void
  onClearFilters: () => void
}

export function OperationLogsPageFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: OperationLogsPageFiltersProps) {
  const { t } = useI18n()
  const fields = useMemo<FilterFieldConfig<OperationLogsFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: t("logs.operation.filters.keywordLabel"),
        icon: <SearchIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-64",
        placeholder: t("logs.operation.filters.keywordPlaceholder"),
      },
      {
        key: "module",
        label: t("logs.operation.filters.moduleLabel"),
        icon: <WaypointsIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-48",
        placeholder: t("logs.operation.filters.modulePlaceholder"),
      },
      {
        key: "biz_type",
        label: t("logs.operation.filters.bizTypeLabel"),
        icon: <TagIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-48",
        placeholder: t("logs.operation.filters.bizTypePlaceholder"),
      },
      {
        key: "operation",
        label: t("logs.operation.filters.operationLabel"),
        icon: <WaypointsIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-48",
        placeholder: t("logs.operation.filters.operationPlaceholder"),
      },
      {
        key: "result",
        label: t("logs.operation.filters.resultLabel"),
        icon: <TagIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        options: [
          {
            value: 1,
            label: t("logs.common.result.success"),
          },
          {
            value: 0,
            label: t("logs.common.result.failure"),
          },
        ],
        className: "w-36",
      },
      {
        key: "trace_id",
        label: t("logs.operation.filters.traceIdLabel"),
        icon: <FingerprintIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-56",
        placeholder: t("logs.operation.filters.traceIdPlaceholder"),
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
