"use client"

import { useMemo, useState } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import type { TenantApplyFilterValue } from "@/components/base/tenant-apply/hooks/use-tenant-apply-controller"
import { createTenantApplyColumns } from "@/components/base/tenant-apply/tenant-apply-page-columns"
import { TenantApplyPageFilters } from "@/components/base/tenant-apply/tenant-apply-page-filters"
import { TenantApplyPageHeader } from "@/components/base/tenant-apply/tenant-apply-page-header"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { type Filter } from "@/components/reui/filters"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import type { TenantApplyData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useI18n } from "@/providers/i18n-provider"

interface TenantApplyPageViewProps {
  filters: Filter<TenantApplyFilterValue>[]
  items: TenantApplyData[]
  total: number
  isFetching: boolean
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: (pagination: {
    pageIndex: number
    pageSize: number
  }) => void
  onFiltersChange: (filters: Filter<TenantApplyFilterValue>[]) => void
  onClearFilters: () => void
  onRefresh: () => void
  onApprove: (row: TenantApplyData) => void
  onReject: (row: TenantApplyData) => void
  onBan: (row: TenantApplyData) => void
}

export function TenantApplyPageView({
  filters,
  items,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onApprove,
  onReject,
  onBan,
}: TenantApplyPageViewProps) {
  const { t } = useI18n()

  const columns = useMemo(
    () => createTenantApplyColumns({ t, onApprove, onReject, onBan }),
    [t, onApprove, onReject, onBan]
  )

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => String(column.id))
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: items,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
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
      <TenantApplyPageHeader isFetching={isFetching} onRefresh={onRefresh} />

      <TenantApplyPageFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
      />

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage={t("common.loading.default")}
        emptyMessage={
          <EntityEmptyState
            title={t("tenant-apply.empty.title")}
            description={t("tenant-apply.empty.description")}
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
