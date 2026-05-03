"use client"

import { useMemo, useState } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { MetricCard } from "@/components/base/shared/metric-card"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table"
import { RefreshCwIcon } from "lucide-react"

interface MetricValue {
  label: string
  value: string | number
  hint?: string
  tone?: "default" | "success" | "warning"
  icon?: React.ReactNode
}

interface LogListPageViewProps<TData extends { id: string }> {
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  metrics: MetricValue[]
  filters: React.ReactNode
  columns: ColumnDef<TData>[]
  items: TData[]
  total: number
  isFetching: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onRefresh: () => void
}

export function LogListPageView<TData extends { id: string }>({
  title,
  description,
  emptyTitle,
  emptyDescription,
  metrics,
  filters,
  columns,
  items,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onRefresh,
}: LogListPageViewProps<TData>) {
  const { t } = useI18n()
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => String(column.id))
  )

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / pagination.pageSize)),
    [pagination.pageSize, total]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: items,
    pageCount,
    manualPagination: true,
    getRowId: (row) => row.id,
    state: {
      pagination,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function" ? updater(pagination) : updater

      onPaginationChange(nextPagination)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full space-y-5 self-start">
      <ManagementPageHeader
        eyebrow={t("navigation.tools.name")}
        title={title}
        description={description}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
            {t("common.actions.refresh")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </ManagementPageHeader>

      {filters}

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage={t("common.loading.default")}
        emptyMessage={
          <EntityEmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        }
        tableLayout={{
          columnsMovable: false,
        }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer className="[&_svg.animate-spin]:text-primary">
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          {total > 0 ? (
            <DataGridPagination
              info="{from} - {to} / {count}"
              rowsPerPageLabel={t("common.pagination.rowsPerPage")}
              previousPageLabel={t("common.pagination.previous")}
              nextPageLabel={t("common.pagination.next")}
            />
          ) : null}
        </div>
      </DataGrid>
    </div>
  )
}
