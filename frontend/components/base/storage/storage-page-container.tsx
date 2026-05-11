"use client"

import { useMemo } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { createStorageColumns } from "./storage-page-columns"
import { StoragePageFilters } from "./storage-page-filters"
import { StoragePageHeader } from "./storage-page-header"
import type { StorageProviderData } from "@/types/storage.types"
import type { StorageRowData } from "./helpers"

interface StoragePageContainerProps {
  providers: StorageProviderData[]
  provider: string
  prefix: string
  pageSize: number
  currentBucket: string
  hasActiveFilters: boolean
  items: StorageRowData[]
  totalOnPage: number
  pageIndex: number
  isFetching: boolean
  isMetaLoading: boolean
  hasNextPage: boolean
  onProviderChange: (value: string) => void
  onPrefixChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onClear: () => void
  onRefresh: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onOpenDetail: (item: StorageRowData) => void
  onCopyKey: (item: StorageRowData) => void
  onCopyUrl: (item: StorageRowData) => void
  onPreview: (item: StorageRowData) => void
}

export function StoragePageContainer({
  providers,
  provider,
  prefix,
  pageSize,
  currentBucket,
  hasActiveFilters,
  items,
  totalOnPage,
  pageIndex,
  isFetching,
  isMetaLoading,
  hasNextPage,
  onProviderChange,
  onPrefixChange,
  onPageSizeChange,
  onClear,
  onRefresh,
  onPrevPage,
  onNextPage,
  onOpenDetail,
  onCopyKey,
  onCopyUrl,
  onPreview,
}: StoragePageContainerProps) {
  const { t } = useI18n()
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )
  const columns = useMemo(
    () =>
      createStorageColumns({
        t,
        onOpenDetail,
        onCopyKey,
        onCopyUrl,
        onPreview,
      }),
    [onCopyKey, onCopyUrl, onOpenDetail, onPreview, t]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: items,
    getRowId: (row) => row.id,
    state: {
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full space-y-5 self-start">
      <StoragePageHeader isFetching={isFetching} onRefresh={onRefresh} />

      <StoragePageFilters
        providers={providers}
        provider={provider}
        prefix={prefix}
        pageSize={pageSize}
        currentBucket={currentBucket}
        hasActiveFilters={hasActiveFilters}
        isLoading={isMetaLoading}
        onProviderChange={onProviderChange}
        onPrefixChange={onPrefixChange}
        onPageSizeChange={onPageSizeChange}
        onClear={onClear}
      />

      <DataGrid
        table={table}
        recordCount={totalOnPage}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage={t("common.loading.default")}
        emptyMessage={
          <EntityEmptyState
            title={t("storage.page.emptyTitle")}
            description={t("storage.page.emptyDescription")}
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

          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {t("storage.pagination.pageHint", {
                page: pageIndex + 1,
                count: totalOnPage,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevPage}
                disabled={pageIndex === 0 || isFetching}
              >
                <ChevronLeftIcon />
                {t("common.pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={!hasNextPage || isFetching}
              >
                {t("common.pagination.next")}
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </DataGrid>
    </div>
  )
}
