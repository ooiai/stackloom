"use client"

import { MenuStatusBadge } from "@/components/base/menus/menu-status-badge"
import { findMenuNode } from "@/components/base/menus/helpers"
import type { MenuTreeNode } from "@/components/base/menus/helpers"
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
import type { MenuData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowRightIcon,
  Edit3Icon,
  EllipsisIcon,
  FolderOpenIcon,
  PlusIcon,
  SquareMenuIcon,
  Trash2Icon,
} from "lucide-react"

export function createMenuColumns({
  permissions,
  t,
  tree,
  onSelectNode,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: {
  permissions: {
    canAddChild: boolean
    canEdit: boolean
    canDelete: (menu: MenuData) => boolean
  }
  t: TranslateFn
  tree: MenuTreeNode[]
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (menu: MenuData) => void
  onDelete: (menu: MenuData) => void
}): ColumnDef<MenuData>[] {
  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("menus.table.name")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => {
        const node = findMenuNode(tree, row.original.id)
        const childCount = node?.children.length ?? 0

        return (
          <div className="flex items-center gap-2.5">
            {childCount > 0 ? (
              <FolderOpenIcon className="size-3.5 text-muted-foreground" />
            ) : (
              <SquareMenuIcon className="size-3.5 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {row.original.name}
              </div>
              <div
                hidden
                className="truncate text-[12px] text-muted-foreground"
              >
                {row.original.code}
              </div>
            </div>
            {childCount > 0 ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t("menus.table.childCount", { count: childCount })}
              </span>
            ) : null}
          </div>
        )
      },
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "code",
      id: "code",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("menus.table.code")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
          {row.original.code || t("common.misc.none")}
        </code>
      ),
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: "path",
      id: "path",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("menus.table.path")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
          {row.original.path || t("common.misc.none")}
        </code>
      ),
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: "sort",
      id: "sort",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("menus.table.sort")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
          {row.original.sort}
        </code>
      ),
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: "component",
      id: "component",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("menus.table.component")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">
          {row.original.component || t("common.misc.none")}
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
          title={t("menus.table.status")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => <MenuStatusBadge status={row.original.status} />,
      size: 110,
      enableSorting: false,
    },
    // {
    //   accessorKey: "updated_at",
    //   id: "updated_at",
    //   header: ({ column }) => (
    //     <DataGridColumnHeader
    //       title={t("menus.table.updatedAt")}
    //       column={column}
    //       className="font-medium"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <span className="text-[12px] text-muted-foreground">
    //       {formatDateTimeAt(row.original.updated_at)}
    //     </span>
    //   ),
    //   size: 170,
    //   enableSorting: false,
    // },
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
            {permissions.canAddChild ? (
              <DropdownMenuItem onClick={() => onOpenAddChild(row.original.id)}>
                <PlusIcon />
                {t("common.actions.addChild")}
              </DropdownMenuItem>
            ) : null}
            {(permissions.canAddChild || permissions.canEdit) ? (
              <DropdownMenuSeparator />
            ) : null}
            {permissions.canEdit ? (
              <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                <Edit3Icon />
                {t("common.actions.edit")}
              </DropdownMenuItem>
            ) : null}
            {(permissions.canAddChild || permissions.canEdit) &&
            permissions.canDelete(row.original) ? (
              <DropdownMenuSeparator />
            ) : null}
            {permissions.canDelete(row.original) ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
                {t("common.actions.delete")}
              </DropdownMenuItem>
            ) : null}
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
