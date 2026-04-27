"use client"

import { EntityNameCell } from "@/components/base/shared/entity-name-cell"
import { UserStatusBadge } from "@/components/base/users/user-status-badge"
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
import { getUserAvatarFallback, getUserDisplayName } from "@/lib/users"
import type { UserData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import { Edit3Icon, EllipsisIcon, Trash2Icon } from "lucide-react"

interface CreateUserColumnsOptions {
  t: TranslateFn
  onOpenEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

export function createUserColumns({
  t,
  onOpenEdit,
  onDelete,
}: CreateUserColumnsOptions): ColumnDef<UserData>[] {
  return [
    {
      accessorKey: "username",
      id: "username",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.user")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <EntityNameCell
          avatarAlt={getUserDisplayName(row.original)}
          avatarFallback={getUserAvatarFallback(row.original)}
          avatarSrc={row.original.avatar_url ?? undefined}
          title={getUserDisplayName(row.original)}
          description={row.original.email || row.original.username}
        />
      ),
      size: 240,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nickname",
      id: "nickname",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.nickname")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nickname || "-"}</span>
      ),
      size: 200,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "phone",
      id: "phone",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.phone")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-[13px] text-foreground/90">
          {row.original.phone || "-"}
        </span>
      ),
      size: 160,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.email")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-[13px] text-foreground/90">
          {row.original.email || "-"}
        </span>
      ),
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.status")}
          column={column}
        />
      ),
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      id: "created_at",
      header: ({ column }) => (
        <DataGridColumnHeader
          className="font-medium"
          title={t("users.table.createdAt")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {formatDateTimeAt(row.original.created_at)}
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
            <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
              <Edit3Icon />
              {t("common.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon />
              {t("common.actions.delete")}
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
