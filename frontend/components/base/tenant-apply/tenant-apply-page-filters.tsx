"use client"

import { useMemo } from "react"

import {
  Filters,
  type Filter,
  type FilterFieldConfig,
  type FilterI18nConfig,
} from "@/components/reui/filters"
import type { TenantApplyFilterValue } from "./hooks/use-tenant-apply-controller"
import { Button } from "@/components/ui/button"
import { getTenantApplyStatusOptions } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import { FunnelXIcon, ListFilterIcon, SearchIcon, ShieldCheckIcon } from "lucide-react"

interface TenantApplyPageFiltersProps {
  filters: Filter<TenantApplyFilterValue>[]
  onFiltersChange: (filters: Filter<TenantApplyFilterValue>[]) => void
  onClearFilters: () => void
}

export function TenantApplyPageFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: TenantApplyPageFiltersProps) {
  const { t } = useI18n()
  const fields = useMemo<FilterFieldConfig<TenantApplyFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: t("tenant-apply.columns.tenant_name"),
        icon: <SearchIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("users.filters.operator.contains") },
        ],
        className: "w-64",
        placeholder: t("tenant-apply.filters.keyword_placeholder"),
      },
      {
        key: "status",
        label: t("tenant-apply.columns.status"),
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("users.filters.operator.is") }],
        options: getTenantApplyStatusOptions(t).map((option) => ({
          value: option.value,
          label: option.label,
        })),
        className: "w-36",
      },
    ],
    [t]
  )

  const i18n = useMemo<Partial<FilterI18nConfig>>(
    () => ({
      addFilter: t("common.actions.addFilter"),
      searchFields: t("users.filters.searchFields"),
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
