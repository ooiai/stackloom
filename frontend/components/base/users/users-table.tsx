"use client"

import { useMemo } from "react"

import { UserStatusBadge } from "@/components/base/users/user-status-badge"
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTimeAt } from "@/lib/time"
import { getUserAvatarFallback, getUserDisplayName } from "@/lib/users"
import type { UserData } from "@/types/base.types"
import type { PaginationState } from "@tanstack/react-table"
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import {
  Edit3Icon,
  EllipsisIcon,
  MailIcon,
  SearchXIcon,
  Trash2Icon,
} from "lucide-react"

interface UsersTableProps {
  users: UserData[]
  total: number
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

function UserNameCell({ user }: { user: UserData }) {
  const displayName = getUserDisplayName(user)

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={user.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{getUserAvatarFallback(user)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 space-y-1">
        <div className="truncate font-medium text-foreground">{displayName}</div>
        <div className="truncate text-xs text-muted-foreground">
          @{user.username}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-muted/40">
        <SearchXIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">没有匹配的用户</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          尝试调整筛选条件，或先创建新的用户资料。
        </p>
      </div>
    </div>
  )
}

export function UsersTable({
  users,
  total,
  isLoading,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const columns = useMemo<ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: "username",
        id: "username",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="用户" />
        ),
        cell: ({ row }) => <UserNameCell user={row.original} />,
        size: 240,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "phone",
        id: "phone",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="手机号" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.phone || "-"}
          </span>
        ),
        size: 160,
        enableSorting: false,
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="邮箱" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <MailIcon className="size-3.5 text-muted-foreground" />
            <span className="truncate text-sm text-foreground">
              {row.original.email || "-"}
            </span>
          </div>
        ),
        size: 240,
        enableSorting: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="状态" />
        ),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
        size: 120,
        enableSorting: false,
      },
      {
        accessorKey: "last_login_at",
        id: "last_login_at",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="最后登录" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.last_login_at
              ? formatDateTimeAt(row.original.last_login_at)
              : "从未登录"}
          </span>
        ),
        size: 180,
        enableSorting: false,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="创建时间" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
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
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit3Icon />
                编辑资料
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
                删除用户
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 64,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onDelete, onEdit]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function" ? updater(pagination) : updater

      onPaginationChange(nextPagination)
    },
  })

  return (
    <DataGrid
      table={table}
      recordCount={total}
      isLoading={isLoading}
      loadingMode="spinner"
      loadingMessage="正在加载用户数据"
      emptyMessage={<EmptyState />}
      tableLayout={{
        headerSticky: true,
      }}
    >
      <div className="space-y-3">
        <DataGridContainer className="rounded-[1.5rem] border-border/70 bg-background shadow-sm">
          <DataGridScrollArea className="max-h-[70svh]" orientation="both">
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>

        {total > 0 ? (
          <DataGridPagination
            rowsPerPageLabel="每页显示"
            previousPageLabel="上一页"
            nextPageLabel="下一页"
            info="{from} - {to} / {count}"
          />
        ) : null}
      </div>
    </DataGrid>
  )
}
