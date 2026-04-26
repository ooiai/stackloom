"use client"

import { Button } from "@/components/ui/button"
import { RefreshCwIcon, UserPlusIcon } from "lucide-react"

interface UsersPageHeaderProps {
  isFetching: boolean
  onRefresh: () => void
  onOpenCreate: () => void
}

export function UsersPageHeader({
  isFetching,
  onRefresh,
  onOpenCreate,
}: UsersPageHeaderProps) {
  return (
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
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          刷新
        </Button>
        <Button onClick={onOpenCreate}>
          <UserPlusIcon />
          添加用户
        </Button>
      </div>
    </div>
  )
}
