"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

interface DictsPageHeaderProps {
  isFetching: boolean
  onRefresh: () => void
  onOpenCreateRoot: () => void
}

export function DictsPageHeader({
  isFetching,
  onRefresh,
  onOpenCreateRoot,
}: DictsPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight">字典管理</h2>
        <p className="text-sm text-muted-foreground">
          维护树形数据字典，统一组织键值、显示文案和扩展配置
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          刷新
        </Button>
        <Button onClick={onOpenCreateRoot}>
          <PlusIcon />
          添加根节点
        </Button>
      </div>
    </div>
  )
}
