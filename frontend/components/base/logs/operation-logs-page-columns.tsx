"use client"

import { LogResultBadge } from "@/components/base/logs/log-result-badge"
import { getNumericResultMeta } from "@/components/base/logs/helpers"
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
import type { OperationLogData } from "@/types/logs.types"
import type { ColumnDef } from "@tanstack/react-table"
import { EllipsisIcon, EyeIcon } from "lucide-react"

interface CreateOperationLogColumnsOptions {
  t: TranslateFn
  onOpenDetail: (log: OperationLogData) => void
}

export function createOperationLogColumns({
  t,
  onOpenDetail,
}: CreateOperationLogColumnsOptions): ColumnDef<OperationLogData>[] {
  return [
    {
      accessorKey: "module",
      id: "module",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.operation.table.module")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-foreground">{row.original.module}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.biz_type}
          </p>
        </div>
      ),
      size: 220,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "summary",
      id: "summary",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.operation.table.summary")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="line-clamp-2 font-medium text-foreground">
            {row.original.summary}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.operation}
          </p>
        </div>
      ),
      size: 320,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "result",
      id: "result",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.operation.table.result")}
          column={column}
        />
      ),
      cell: ({ row }) => {
        const meta = getNumericResultMeta(row.original.result, t)

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
          title={t("logs.operation.table.traceId")}
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
      accessorKey: "biz_id",
      id: "biz_id",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.operation.table.bizId")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span>{row.original.biz_id || t("common.misc.none")}</span>
      ),
      size: 160,
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      id: "created_at",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.operation.table.createdAt")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span>{formatDateTimeAt(row.original.created_at)}</span>
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
