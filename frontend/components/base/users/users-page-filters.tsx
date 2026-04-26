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
import { USER_STATUS_OPTIONS } from "@/lib/users"
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
  const fields = useMemo<FilterFieldConfig<UsersFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: "关键词",
        icon: <UserIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [{ value: "contains", label: "包含" }],
        className: "w-56",
        placeholder: "搜索用户名、昵称、邮箱或手机号",
      },
      {
        key: "status",
        label: "状态",
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: "是" }],
        options: USER_STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
        className: "w-36",
      },
    ],
    []
  )

  const i18n = useMemo<Partial<FilterI18nConfig>>(
    () => ({
      addFilter: "过滤字段",
      searchFields: "搜索筛选字段...",
    }),
    []
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
              添加筛选
            </Button>
          }
          i18n={i18n}
        />
      </div>
      {filters.length > 0 ? (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <FunnelXIcon />
          清空
        </Button>
      ) : null}
    </div>
  )
}
