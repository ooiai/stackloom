"use client"

import { TenantStatusBadge } from "@/components/base/tenants/tenant-status-badge"
import { findTenantNode } from "@/components/base/tenants/helpers"
import type { TenantTreeNode } from "@/components/base/tenants/helpers"
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
import type { TenantData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowRightIcon,
  Building2Icon,
  Edit3Icon,
  EllipsisIcon,
  FolderOpenIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

export function createTenantColumns({
  t,
  tree,
  onSelectNode,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: {
  t: TranslateFn
  tree: TenantTreeNode[]
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}): ColumnDef<TenantData>[] {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.name")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => {
        const node = findTenantNode(tree, row.original.id)
        const childCount = node?.children.length ?? 0

        return (
          <div className="flex items-center gap-2.5">
            {childCount > 0 ? (
              <FolderOpenIcon className="size-3.5 text-muted-foreground" />
            ) : (
              <Building2Icon className="size-3.5 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {row.original.name}
              </div>
              <div
                hidden
                className="truncate text-[12px] text-muted-foreground"
              >
                {row.original.slug}
              </div>
            </div>
            {childCount > 0 ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t("tenants.table.childCount", { count: childCount })}
              </span>
            ) : null}
          </div>
        )
      },
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "slug",
      id: "slug",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.slug")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-muted px-1.5 py-1 text-[11px] text-foreground/80">
          {row.original.slug}
        </code>
      ),
      size: 150,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.status")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => <TenantStatusBadge status={row.original.status} />,
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: "plan_code",
      id: "plan_code",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.planCode")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.plan_code || t("common.misc.none")}
        </span>
      ),
      size: 150,
      enableSorting: false,
    },
    {
      accessorKey: "description",
      id: "description",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.description")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <span className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
          {row.original.description || t("common.misc.none")}
        </span>
      ),
      size: 260,
      enableSorting: false,
    },
    {
      accessorKey: "updated_at",
      id: "updated_at",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("tenants.table.updatedAt")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {formatDateTimeAt(row.original.updated_at)}
        </span>
      ),
      size: 170,
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => onSelectNode(row.original.id)}>
              <ArrowRightIcon />
              {t("common.actions.viewChildren")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddChild(row.original.id)}>
              <PlusIcon />
              {t("common.actions.addChild")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
