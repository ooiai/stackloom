"use client"

import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TranslateFn } from "@/lib/i18n"
import { formatDateTimeAt } from "@/lib/time"
import type { ColumnDef } from "@tanstack/react-table"
import { CopyIcon, EllipsisIcon, EyeIcon, ExternalLinkIcon } from "lucide-react"
import type { StorageRowData } from "./helpers"
import { formatStorageBytes, formatStorageValue } from "./helpers"

interface CreateStorageColumnsOptions {
  t: TranslateFn
  onOpenDetail: (item: StorageRowData) => void
  onCopyKey: (item: StorageRowData) => void
  onCopyUrl: (item: StorageRowData) => void
  onPreview: (item: StorageRowData) => void
}

export function createStorageColumns({
  t,
  onOpenDetail,
  onCopyKey,
  onCopyUrl,
  onPreview,
}: CreateStorageColumnsOptions): ColumnDef<StorageRowData>[] {
  return [
    {
      accessorKey: "key",
      id: "key",
      header: ({ column }) => (
        <DataGridColumnHeader title={t("storage.table.key")} column={column} />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-foreground break-all">{row.original.key}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.bucket} / {row.original.provider}
          </p>
        </div>
      ),
      size: 420,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "size",
      id: "size",
      header: ({ column }) => (
        <DataGridColumnHeader title={t("storage.table.size")} column={column} />
      ),
      cell: ({ row }) => <span>{formatStorageBytes(row.original.size)}</span>,
      size: 120,
      enableSorting: false,
    },
    {
      accessorKey: "storage_class",
      id: "storage_class",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("storage.table.storageClass")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span>{formatStorageValue(row.original.storage_class)}</span>
      ),
      size: 140,
      enableSorting: false,
    },
    {
      accessorKey: "etag",
      id: "etag",
      header: ({ column }) => (
        <DataGridColumnHeader title={t("storage.table.etag")} column={column} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatStorageValue(row.original.etag)}</span>
      ),
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "last_modified",
      id: "last_modified",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("storage.table.lastModified")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span>
          {row.original.last_modified
            ? formatDateTimeAt(row.original.last_modified)
            : t("common.misc.none")}
        </span>
      ),
      size: 180,
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="size-7" variant="ghost" />}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => onOpenDetail(row.original)}>
              <EyeIcon />
              {t("storage.actions.viewDetail")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPreview(row.original)}>
              <ExternalLinkIcon />
              {t("storage.actions.preview")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyKey(row.original)}>
              <CopyIcon />
              {t("storage.actions.copyKey")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyUrl(row.original)}>
              <CopyIcon />
              {t("storage.actions.copyUrl")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    },
  ]
}
