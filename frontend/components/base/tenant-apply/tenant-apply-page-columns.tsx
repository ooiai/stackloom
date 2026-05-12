"use client"

import { EntityNameCell } from "@/components/base/shared/entity-name-cell"
import { TenantApplyStatusBadge } from "./tenant-apply-status-badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TranslateFn } from "@/lib/i18n"
import { formatDateTimeAt } from "@/lib/time"
import type { TenantApplyData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import { BanIcon, CheckCircleIcon, EllipsisIcon, XCircleIcon } from "lucide-react"

interface CreateTenantApplyColumnsOptions {
  t: TranslateFn
  onApprove: (row: TenantApplyData) => void
  onReject: (row: TenantApplyData) => void
  onBan: (row: TenantApplyData) => void
}

export function createTenantApplyColumns({
  t,
  onApprove,
  onReject,
  onBan,
}: CreateTenantApplyColumnsOptions): ColumnDef<TenantApplyData>[] {
  return [
    {
      accessorKey: "tenant_name",
      id: "tenant_name",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.tenant_name")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{row.original.tenant_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.tenant_slug}</p>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "applicant_username",
      id: "applicant",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.applicant")}
          column={column}
        />
      ),
      cell: ({ row }) => {
        const r = row.original
        return (
          <EntityNameCell
            avatarAlt={r.applicant_name ?? r.applicant_username}
            avatarFallback={(r.applicant_name ?? r.applicant_username).slice(0, 2).toUpperCase()}
            avatarSrc={r.applicant_avatar ?? undefined}
            title={r.applicant_name ?? r.applicant_username}
            description={r.applicant_username}
          />
        )
      },
      size: 200,
    },
    {
      accessorKey: "applicant_phone",
      id: "phone",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.phone")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.applicant_phone ?? "—"}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "applicant_email",
      id: "email",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.email")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.applicant_email ?? "—"}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: "membership_status",
      id: "status",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.status")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <TenantApplyStatusBadge status={row.original.membership_status} />
      ),
      size: 110,
    },
    {
      accessorKey: "created_at",
      id: "applied_at",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("tenant-apply.columns.applied_at")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTimeAt(row.original.created_at)}
        </span>
      ),
      size: 160,
    },
    {
      id: "actions",
      header: () => (
        <span className="text-sm font-medium text-muted-foreground">
          {t("tenant-apply.columns.actions")}
        </span>
      ),
      cell: ({ row }) => {
        const isPending = row.original.membership_status === 2
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" />}>
              <EllipsisIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending ? (
                <>
                  <DropdownMenuItem onClick={() => onApprove(row.original)}>
                    <CheckCircleIcon className="size-4 text-green-500" />
                    {t("tenant-apply.actions.approve")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReject(row.original)}>
                    <XCircleIcon className="size-4 text-yellow-500" />
                    {t("tenant-apply.actions.reject")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onBan(row.original)}
              >
                <BanIcon className="size-4" />
                {t("tenant-apply.actions.ban")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 64,
    },
  ]
}
