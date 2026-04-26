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
        <h2 className="text-lg font-bold tracking-tight">字典管理</h2>
        <p className="text-sm text-muted-foreground">
          字典是一种键值对数据结构，常用于存储和管理配置信息、翻译文本等
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
        <Button hidden onClick={onOpenCreateRoot}>
          <PlusIcon />
          添加根字典
        </Button>
      </div>
    </div>
  )
}
