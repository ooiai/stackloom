"use client"

import { useMemo } from "react"

import {
  Filters,
  type Filter,
  type FilterFieldConfig,
  type FilterI18nConfig,
} from "@/components/reui/filters"
import type { UsersFilterValue } from "@/components/base/users/hooks/use-users-controller"
import { Button } from "@/components/ui/button"
import { getUserStatusOptions } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import {
  FunnelXIcon,
  ListFilterIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"

interface UsersPageFiltersProps {
  filters: Filter<UsersFilterValue>[]
  onFiltersChange: (filters: Filter<UsersFilterValue>[]) => void
  onClearFilters: () => void
}

export function UsersPageFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: UsersPageFiltersProps) {
  const { t } = useI18n()
  const fields = useMemo<FilterFieldConfig<UsersFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: t("users.filters.keywordLabel"),
        icon: <UserIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [
          { value: "contains", label: t("users.filters.operator.contains") },
        ],
        className: "w-56",
        placeholder: t("users.filters.keywordPlaceholder"),
      },
      {
        key: "status",
        label: t("users.filters.statusLabel"),
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: t("users.filters.operator.is") }],
        options: getUserStatusOptions(t).map((option) => ({
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
      addFilter: t("users.filters.addField"),
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
