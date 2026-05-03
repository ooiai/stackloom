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
import type { SystemLogsFilterValue } from "@/components/base/logs/hooks/use-system-logs-controller"
import {
  FingerprintIcon,
  FunnelXIcon,
  HashIcon,
  ListFilterIcon,
  RouteIcon,
  WaypointsIcon,
} from "lucide-react"

interface SystemLogsPageFiltersProps {
  filters: Filter<SystemLogsFilterValue>[]
  onFiltersChange: (filters: Filter<SystemLogsFilterValue>[]) => void
  onClearFilters: () => void
}

export function SystemLogsPageFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: SystemLogsPageFiltersProps) {
  const { t } = useI18n()
  const fields = useMemo<FilterFieldConfig<SystemLogsFilterValue>[]>(
    () => [
      {
        key: "trace_id",
        label: t("logs.system.filters.traceIdLabel"),
        icon: <FingerprintIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-56",
        placeholder: t("logs.system.filters.traceIdPlaceholder"),
      },
      {
        key: "request_id",
        label: t("logs.system.filters.requestIdLabel"),
        icon: <FingerprintIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-56",
        placeholder: t("logs.system.filters.requestIdPlaceholder"),
      },
      {
        key: "method",
        label: t("logs.system.filters.methodLabel"),
        icon: <WaypointsIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({
          value,
          label: value,
        })),
        className: "w-36",
      },
      {
        key: "result",
        label: t("logs.system.filters.resultLabel"),
        icon: <HashIcon className="size-3.5" />,
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
      {
        key: "path",
        label: t("logs.system.filters.pathLabel"),
        icon: <RouteIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("logs.filters.operator.contains") },
        ],
        className: "w-64",
        placeholder: t("logs.system.filters.pathPlaceholder"),
      },
      {
        key: "status_code",
        label: t("logs.system.filters.statusCodeLabel"),
        icon: <HashIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("logs.filters.operator.is") }],
        className: "w-40",
        placeholder: t("logs.system.filters.statusCodePlaceholder"),
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
