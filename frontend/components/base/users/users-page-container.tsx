"use client"

import { useMemo, useState } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import type { UsersFilterValue } from "@/components/base/users/hooks/use-users-controller"
import { createUserColumns } from "@/components/base/users/users-page-columns"
import { UsersPageFilters } from "@/components/base/users/users-page-filters"
import { UsersPageHeader } from "@/components/base/users/users-page-header"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { type Filter } from "@/components/reui/filters"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import type { UserData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface UsersPageViewProps {
  filters: Filter<UsersFilterValue>[]
  users: UserData[]
  total: number
  isFetching: boolean
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: (pagination: {
    pageIndex: number
    pageSize: number
  }) => void
  onFiltersChange: (filters: Filter<UsersFilterValue>[]) => void
  onClearFilters: () => void
  onRefresh: () => void
  onOpenCreate: () => void
  onOpenEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

export function UsersPageView({
  filters,
  users,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: UsersPageViewProps) {
  const columns = useMemo(
    () => createUserColumns({ onOpenEdit, onDelete }),
    [onDelete, onOpenEdit]
  )

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => String(column.id))
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: users,
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
      <UsersPageHeader
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreate={onOpenCreate}
      />

      <UsersPageFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
      />

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage="加载中..."
        emptyMessage={
          <EntityEmptyState
            title="暂无相关用户"
            description="尝试调整筛选条件，或者先创建一位新的系统用户。"
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
              rowsPerPageLabel="每页显示"
              previousPageLabel="上一页"
              nextPageLabel="下一页"
            />
          ) : null}
        </div>
      </DataGrid>
    </div>
  )
}
