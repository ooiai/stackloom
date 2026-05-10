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
import type { AuditLogData } from "@/types/logs.types"
import type { ColumnDef } from "@tanstack/react-table"
import { EllipsisIcon, EyeIcon } from "lucide-react"

interface CreateAuditLogColumnsOptions {
  t: TranslateFn
  onOpenDetail: (log: AuditLogData) => void
}

export function createAuditLogColumns({
  t,
  onOpenDetail,
}: CreateAuditLogColumnsOptions): ColumnDef<AuditLogData>[] {
  return [
    {
      accessorKey: "target_type",
      id: "target_type",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.audit.table.target")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {row.original.target_type}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.original.target_id}
          </p>
        </div>
      ),
      size: 220,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "action",
      id: "action",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.audit.table.action")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.action}</span>
      ),
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: "result",
      id: "result",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.audit.table.result")}
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
          title={t("logs.audit.table.traceId")}
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
      accessorKey: "reason",
      id: "reason",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("logs.audit.table.reason")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span>{row.original.reason || t("common.misc.none")}</span>
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
          title={t("logs.audit.table.createdAt")}
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
