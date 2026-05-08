"use client"

import { DictStatusBadge } from "@/components/base/dicts/dict-status-badge"
import { findDictNode } from "@/components/base/dicts/helpers"
import type { DictTreeNode } from "@/components/base/dicts/helpers"
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
import type { DictData } from "@/types/base.types"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowRightIcon,
  Edit3Icon,
  EllipsisIcon,
  FolderOpenIcon,
  PlusIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

interface CreateDictColumnsOptions {
  permissions: {
    canAddChild: boolean
    canEdit: boolean
    canDelete: (dict: DictData) => boolean
  }
  t: TranslateFn
  tree: DictTreeNode[]
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (dict: DictData) => void
  onDelete: (dict: DictData) => void
}

export function createDictColumns({
  permissions,
  t,
  tree,
  onSelectNode,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: CreateDictColumnsOptions): ColumnDef<DictData>[] {
  return [
    {
      accessorKey: "label",
      id: "label",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("dicts.table.name")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => {
        const node = findDictNode(tree, row.original.id)
        const childCount = node?.children.length ?? 0

        return (
          <div className="flex items-center gap-2.5">
            {childCount > 0 ? (
              <FolderOpenIcon className="size-3.5 text-muted-foreground" />
            ) : (
              <TagIcon className="size-3.5 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {row.original.label}
              </div>
              {/*<div className="truncate text-[12px] text-muted-foreground">
                {row.original.dict_key}
              </div>*/}
            </div>
            {childCount > 0 ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t("dicts.table.childCount", { count: childCount })}
              </span>
            ) : null}
          </div>
        )
      },
      size: 220,
      enableSorting: false,
    },
    {
      accessorKey: "dict_key",
      id: "dict_key",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("dicts.table.value")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
          {row.original.dict_key}
        </code>
      ),
      size: 150,
      enableSorting: false,
    },
    {
      accessorKey: "dict_value",
      id: "dict_value",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("dicts.table.value")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <code className="rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
          {row.original.dict_value}
        </code>
      ),
      size: 150,
      enableSorting: false,
    },
    // {
    //   accessorKey: "value_type",
    //   id: "value_type",
    //   header: ({ column }) => (
    //     <DataGridColumnHeader
    //       title={t("dicts.table.valueType")}
    //       column={column}
    //       className="font-medium"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <span className="text-[13px] text-muted-foreground">
    //       {row.original.value_type}
    //     </span>
    //   ),
    //   size: 110,
    //   enableSorting: false,
    // },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("dicts.table.status")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => <DictStatusBadge status={row.original.status} />,
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: "description",
      id: "description",
      header: ({ column }) => (
        <DataGridColumnHeader
          title={t("dicts.table.description")}
          column={column}
          className="font-medium"
        />
      ),
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">
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
          title={t("dicts.table.updatedAt")}
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
