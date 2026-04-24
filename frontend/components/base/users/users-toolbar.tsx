"use client"

import { useMemo } from "react"

import {
  FilterI18nConfig,
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import { USER_STATUS_OPTIONS } from "@/lib/users"
import {
  FunnelXIcon,
  ListFilterIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react"

type UsersFilterValue = string | number

interface UsersToolbarProps {
  filters: Filter<UsersFilterValue>[]
  onFiltersChange: (filters: Filter<UsersFilterValue>[]) => void
  onClearFilters: () => void
  onRefresh: () => void
  isRefreshing: boolean
  resultCount: number
}

export function UsersToolbar({
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  isRefreshing,
  resultCount,
}: UsersToolbarProps) {
  const fields = useMemo<FilterFieldConfig<UsersFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: "关键词",
        icon: <SearchIcon className="size-3.5" />,
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
      addFilter: "添加筛选",
      addFilterTitle: "选择筛选条件",
      searchFields: "搜索筛选字段",
      noFieldsFound: "没有可用筛选项",
      noResultsFound: "没有找到匹配项",
      select: "请选择",
    }),
    []
  )

  const activeFilterCount = filters.filter((filter) => filter.values.length > 0)
    .length

  return (
    <section className="rounded-[1.5rem] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">筛选与操作</p>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                已启用 {activeFilterCount} 个条件
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            将最常用的关键词和状态放在同一条操作带里，减少来回切换。
            当前匹配 {resultCount} 位用户。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCwIcon
              className={isRefreshing ? "animate-spin" : undefined}
            />
            刷新
          </Button>
          {activeFilterCount > 0 ? (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <FunnelXIcon />
              清空条件
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <Filters
          filters={filters}
          fields={fields}
          onChange={onFiltersChange}
          allowMultiple
          showSearchInput={false}
          size="sm"
          i18n={i18n}
          trigger={
            <Button variant="outline" size="sm">
              <ListFilterIcon />
              添加筛选
            </Button>
          }
        />
      </div>
    </section>
  )
}
