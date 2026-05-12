"use client"

import { useMemo, useState } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { createOAuthClientColumns } from "@/components/base/oauth-clients/oauth-clients-page-columns"
import { OAuthClientsPageHeader } from "@/components/base/oauth-clients/oauth-clients-page-header"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Input } from "@/components/ui/input"
import type { OAuthClientData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useI18n } from "@/providers/i18n-provider"
import type { PaginationState } from "@tanstack/react-table"
import { SearchIcon } from "lucide-react"

interface OAuthClientsPageContainerProps {
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canRotateSecret: boolean
    canDelete: boolean
    hasAnyRowAction: boolean
  }
  keyword: string
  clients: OAuthClientData[]
  total: number
  isFetching: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onKeywordChange: (keyword: string) => void
  onRefresh: () => void
  onOpenCreate: () => void
  onOpenEdit: (client: OAuthClientData) => void
  onRotateSecret: (client: OAuthClientData) => void
  onDelete: (client: OAuthClientData) => void
}

export function OAuthClientsPageContainer({
  permissions,
  keyword,
  clients,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onKeywordChange,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onRotateSecret,
  onDelete,
}: OAuthClientsPageContainerProps) {
  const { t } = useI18n()

  const columns = useMemo(
    () =>
      createOAuthClientColumns({
        permissions,
        t,
        onOpenEdit,
        onRotateSecret,
        onDelete,
      }),
    [onDelete, onOpenEdit, onRotateSecret, permissions, t]
  )

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => String(column.id))
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: clients,
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
      <OAuthClientsPageHeader
        canCreate={permissions.canCreate}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreate={onOpenCreate}
      />

      <div className="flex items-center gap-2">
        <div className="relative max-w-72 flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t("oauth-clients.filters.keywordPlaceholder")}
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
        </div>
      </div>

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage={t("common.loading.default")}
        emptyMessage={
          <EntityEmptyState
            title={t("oauth-clients.page.emptyTitle")}
            description={t("oauth-clients.page.emptyDescription")}
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
