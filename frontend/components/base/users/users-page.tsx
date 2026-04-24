"use client"

import { useMemo, useState } from "react"

import { UserMutateSheet } from "@/components/base/users/user-mutate-sheet"
import { UserStatusBadge } from "@/components/base/users/user-status-badge"
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUsersPage } from "@/hooks/use-users-page"
import { formatDateTimeAt } from "@/lib/time"
import {
  USER_STATUS_OPTIONS,
  getUserAvatarFallback,
  getUserDisplayName,
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
  SearchXIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react"

type UsersFilterValue = string | number

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-muted/40">
        <SearchXIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">暂无相关用户</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          尝试调整筛选条件，或者先创建一位新的系统用户。
        </p>
      </div>
    </div>
  )
}

function NameCell({ user }: { user: UserData }) {
  const display = getUserDisplayName(user)

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={user.avatar_url ?? undefined} alt={display} />
        <AvatarFallback className="font-medium">
          {getUserAvatarFallback(user)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-px">
        <div className="truncate font-medium text-foreground">{display}</div>
        <div className="max-w-44 truncate text-xs text-muted-foreground">
          {user.email || user.username}
        </div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const {
    filters,
    users,
    total,
    isFetching,
    isSubmitting,
    pagination,
    sheet,
    setPagination,
    openCreate,
    openEdit,
    closeSheet,
    submitSheet,
    clearFilters,
    confirmRemoveUser,
    handleFiltersChange,
    refetchUsers,
  } = useUsersPage()

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
        cell: ({ row }) => <NameCell user={row.original} />,
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
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Edit3Icon />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => confirmRemoveUser(row.original)}
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
    [confirmRemoveUser, openEdit]
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

      setPagination(nextPagination)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full self-start space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">用户管理</h2>
          <p className="text-sm text-muted-foreground">
            统一维护系统用户资料、基础联系信息与账号状态。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetchUsers()
            }}
            disabled={isFetching}
          >
            <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
            刷新
          </Button>
          <Button onClick={openCreate}>
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
              handleFiltersChange(nextFilters as Filter<UsersFilterValue>[])
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
          <Button variant="outline" size="sm" onClick={clearFilters}>
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
        emptyMessage={<EmptyState />}
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

      <UserMutateSheet
        key={`${sheet.mode}-${sheet.user?.id ?? "new"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        user={sheet.user}
        isPending={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
          }
        }}
        onSubmit={submitSheet}
      />
    </div>
  )
}
