"use client"

import { useMemo } from "react"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { MetricCard } from "@/components/base/shared/metric-card"
import { UserMutateSheet } from "@/components/base/users/user-mutate-sheet"
import { UsersTable } from "@/components/base/users/users-table"
import { UsersToolbar } from "@/components/base/users/users-toolbar"
import { Button } from "@/components/ui/button"
import { useUsersPage } from "@/hooks/use-users-page"
import { LockIcon, ShieldCheckIcon, UserPlusIcon, UsersIcon } from "lucide-react"

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

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 1).length
    const lockedUsers = users.filter((user) => user.status === 2).length

    return {
      activeUsers,
      lockedUsers,
    }
  }, [users])

  return (
    <div className="flex flex-col gap-6">
      <ManagementPageHeader
        eyebrow="Admin / UPMS"
        title="用户管理"
        description="维护系统用户、联络方式与账号状态。将主要操作集中在单页流程里，降低筛选、录入和删除时的上下文切换。"
        actions={
          <Button onClick={openCreate}>
            <UserPlusIcon />
            新增用户
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="匹配用户"
            value={total}
            hint="基于当前筛选条件统计的结果总数。"
            icon={<UsersIcon className="size-4" />}
          />
          <MetricCard
            label="当前页正常状态"
            value={stats.activeUsers}
            hint="帮助管理员快速确认活跃账号分布。"
            tone="success"
            icon={<ShieldCheckIcon className="size-4" />}
          />
          <MetricCard
            label="当前页锁定账号"
            value={stats.lockedUsers}
            hint="异常状态前置，避免问题账号被忽略。"
            tone="warning"
            icon={<LockIcon className="size-4" />}
          />
        </div>
      </ManagementPageHeader>

      <UsersToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
        onRefresh={() => {
          void refetchUsers()
        }}
        isRefreshing={isFetching}
        resultCount={total}
      />

      <UsersTable
        users={users}
        total={total}
        isLoading={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        onEdit={openEdit}
        onDelete={confirmRemoveUser}
      />

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
