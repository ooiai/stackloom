"use client"

import { LogResultBadge } from "@/components/base/logs/log-result-badge"
import { getStringResultMeta } from "@/components/base/logs/helpers"
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
import type { SystemLogData } from "@/types/logs.types"
import type { ColumnDef } from "@tanstack/react-table"
import { EllipsisIcon, EyeIcon } from "lucide-react"

interface CreateSystemLogColumnsOptions {
  t: TranslateFn
  onOpenDetail: (log: SystemLogData) => void
}

export function createSystemLogColumns({
  t,
  onOpenDetail,
}: CreateSystemLogColumnsOptions): ColumnDef<SystemLogData>[] {
  return [
    {
      accessorKey: "method",
      id: "method",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.method")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium tracking-wide">{row.original.method}</span>
      ),
      size: 110,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "path",
      id: "path",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.request")}
          column={column}
        />
      ),
      cell: ({ row }) => {
        const descriptor = [row.original.module, row.original.action]
          .filter(Boolean)
          .join(" / ")

        return (
          <div className="space-y-1">
            <p className="font-medium text-foreground">{row.original.path}</p>
            <p className="text-xs text-muted-foreground">
              {descriptor || t("common.misc.none")}
            </p>
          </div>
        )
      },
      size: 320,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status_code",
      id: "status_code",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.statusCode")}
          column={column}
        />
      ),
      cell: ({ row }) => <span>{row.original.status_code}</span>,
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: "result",
      id: "result",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.result")}
          column={column}
        />
      ),
      cell: ({ row }) => {
        const meta = getStringResultMeta(row.original.result, t)

        return <LogResultBadge label={meta.label} variant={meta.badgeVariant} />
      },
      size: 120,
      enableSorting: false,
    },
    {
      accessorKey: "trace_id",
      id: "trace_id",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.traceId")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.trace_id || t("common.misc.none")}
        </span>
      ),
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      id: "created_at",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.system.table.createdAt")}
          column={column}
        />
      ),
      cell: ({ row }) => <span>{formatDateTimeAt(row.original.created_at)}</span>,
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
              {t("logs.common.actions.viewDetail")}
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
