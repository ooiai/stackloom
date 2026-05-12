"use client"

import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { OAuthClientStatusBadge } from "@/components/base/oauth-clients/oauth-client-status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TranslateFn } from "@/lib/i18n"
import type { OAuthClientData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import { Edit3Icon, EllipsisIcon, KeyRoundIcon, Trash2Icon } from "lucide-react"

interface CreateOAuthClientColumnsOptions {
  permissions: {
    canEdit: boolean
    canRotateSecret: boolean
    canDelete: boolean
    hasAnyRowAction: boolean
  }
  t: TranslateFn
  onOpenEdit: (client: OAuthClientData) => void
  onRotateSecret: (client: OAuthClientData) => void
  onDelete: (client: OAuthClientData) => void
}

export function createOAuthClientColumns({
  permissions,
  t,
  onOpenEdit,
  onRotateSecret,
  onDelete,
}: CreateOAuthClientColumnsOptions): ColumnDef<OAuthClientData>[] {
  const columns: ColumnDef<OAuthClientData>[] = [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("oauth-clients.table.name")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="min-w-0 space-y-px">
          <div className="truncate font-medium text-foreground">
            {row.original.name}
          </div>
          <div className="max-w-56 truncate font-mono text-xs text-muted-foreground">
            {row.original.client_id}
          </div>
        </div>
      ),
      size: 260,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "allowed_scopes",
      id: "allowed_scopes",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("oauth-clients.table.scopes")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.allowed_scopes.map((scope) => (
            <Badge key={scope} variant="outline" size="sm">
              {scope}
            </Badge>
          ))}
        </div>
      ),
      size: 280,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("oauth-clients.table.status")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <OAuthClientStatusBadge status={row.original.status} />
      ),
      size: 110,
      enableSorting: false,
    },
  ]

  if (!permissions.hasAnyRowAction) {
    return columns
  }

  const hasManageAction = permissions.canEdit || permissions.canRotateSecret

  columns.push({
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
          {permissions.canEdit ? (
            <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
              <Edit3Icon />
              {t("oauth-clients.actions.edit")}
            </DropdownMenuItem>
          ) : null}
          {permissions.canRotateSecret ? (
            <DropdownMenuItem onClick={() => onRotateSecret(row.original)}>
              <KeyRoundIcon />
              {t("oauth-clients.actions.rotateSecret")}
            </DropdownMenuItem>
          ) : null}
          {hasManageAction && permissions.canDelete ? (
            <DropdownMenuSeparator />
          ) : null}
          {permissions.canDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon />
              {t("oauth-clients.actions.delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  })

  return columns
}
