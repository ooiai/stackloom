"use client"

import { useMemo, useState } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { EntityNameCell } from "@/components/base/shared/entity-name-cell"
import { UserStatusBadge } from "@/components/base/users/user-status-badge"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid-pagination"
import { DataGridTable } from "@/components/reui/data-grid-table"
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
  type FilterI18nConfig,
} from "@/components/reui/filters"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UsersFilterValue } from "@/hooks/use-users-controller"
import { formatDateTimeAt } from "@/lib/time"
import {
  getUserAvatarFallback,
  getUserDisplayName,
  USER_STATUS_OPTIONS,
} from "@/lib/users"
import type { UserData } from "@/types/base.types"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Edit3Icon,
  EllipsisIcon,
  FunnelXIcon,
  ListFilterIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react"

interface UsersPageViewProps {
  filters: Filter<UsersFilterValue>[]
  users: UserData[]
  total: number
  isFetching: boolean
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: (pagination: {
    pageIndex: number
    pageSize: number
  }) => void
  onFiltersChange: (filters: Filter<UsersFilterValue>[]) => void
  onClearFilters: () => void
  onRefresh: () => void
  onOpenCreate: () => void
  onOpenEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

export function UsersPageView({
  filters,
  users,
  total,
  isFetching,
  pagination,
  onPaginationChange,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: UsersPageViewProps) {
  const fields = useMemo<FilterFieldConfig<UsersFilterValue>[]>(
    () => [
      {
        key: "keyword",
        label: "关键词",
        icon: <UserIcon className="size-3.5" />,
        type: "text",
        defaultOperator: "contains",
        operators: [{ value: "contains", label: "包含" }],
        className: "w-56",
        placeholder: "搜索用户名、昵称、邮箱或手机号",
      },
      {
        key: "status",
        label: "状态",
        icon: <ShieldCheckIcon className="size-3.5" />,
        type: "select",
        defaultOperator: "is",
        operators: [{ value: "is", label: "是" }],
        options: USER_STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
        className: "w-36",
      },
    ],
    []
  )

  const i18n = useMemo<Partial<FilterI18nConfig>>(
    () => ({
      addFilter: "过滤字段",
      searchFields: "搜索筛选字段...",
    }),
    []
  )

  const columns = useMemo<ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: "username",
        id: "username",
        header: ({ column }) => (
          <DataGridColumnHeader
            className="font-medium"
            title="用户"
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
            title="昵称"
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
            title="手机号"
            column={column}
          />
        ),
        cell: ({ row }) => <span>{row.original.phone || "-"}</span>,
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
            title="邮箱"
            column={column}
          />
        ),
        cell: ({ row }) => <span>{row.original.email || "-"}</span>,
        size: 220,
        enableSorting: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            className="font-medium"
            title="状态"
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
            title="创建时间"
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
              <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                <Edit3Icon />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [onDelete, onOpenEdit]
  )

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => String(column.id))
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: users,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    getRowId: (row) => row.id,
    state: {
      pagination,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function" ? updater(pagination) : updater

      onPaginationChange(nextPagination)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full space-y-5 self-start">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">用户管理</h2>
          <p className="text-sm text-muted-foreground">
            统一维护系统用户资料、基础联系信息与账号状态。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            hidden
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCwIcon
              className={isFetching ? "animate-spin" : undefined}
            />
            刷新
          </Button>
          <Button onClick={onOpenCreate}>
            <UserPlusIcon />
            添加用户
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="flex-1">
          <Filters
            filters={filters as Filter<UsersFilterValue>[]}
            fields={fields}
            showSearchInput={false}
            allowMultiple
            onChange={(nextFilters) =>
              onFiltersChange(nextFilters as Filter<UsersFilterValue>[])
            }
            variant="default"
            size="sm"
            trigger={
              <Button variant="outline" size="sm">
                <ListFilterIcon />
                添加筛选
              </Button>
            }
            i18n={i18n}
          />
        </div>
        {filters.length > 0 ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <FunnelXIcon />
            清空
          </Button>
        ) : null}
      </div>

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage="加载中..."
        emptyMessage={
          <EntityEmptyState
            title="暂无相关用户"
            description="尝试调整筛选条件，或者先创建一位新的系统用户。"
          />
        }
        tableLayout={{
          columnsMovable: false,
        }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer className="[&_svg.animate-spin]:text-primary">
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          {total > 0 ? (
            <DataGridPagination
              info="{from} - {to} / {count}"
              rowsPerPageLabel="每页显示"
              previousPageLabel="上一页"
              nextPageLabel="下一页"
            />
          ) : null}
        </div>
      </DataGrid>
    </div>
  )
}
