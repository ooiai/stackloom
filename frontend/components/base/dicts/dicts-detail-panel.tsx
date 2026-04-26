"use client"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { DictStatusBadge } from "@/components/base/dicts/dict-status-badge"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DictTreeNode } from "@/lib/dicts"
import type { DictData } from "@/types/base.types"
import type { Table } from "@tanstack/react-table"
import {
  ChevronRightIcon,
  Edit3Icon,
  FolderOpenIcon,
  HomeIcon,
  PlusIcon,
  TagIcon,
} from "lucide-react"

interface DictsDetailPanelProps {
  selectedNode: DictTreeNode | null
  breadcrumb: DictTreeNode[]
  childItems: DictData[]
  table: Table<DictData>
  isFetching: boolean
  onSelectNode: (id: string | null) => void
  onOpenEdit: (dict: DictData) => void
  onOpenAddChild: (parentId: string) => void
}

export function DictsDetailPanel({
  selectedNode,
  breadcrumb,
  childItems,
  table,
  isFetching,
  onSelectNode,
  onOpenEdit,
  onOpenAddChild,
}: DictsDetailPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex min-h-140 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card">
        <EntityEmptyState
          title="选择字典节点"
          description="选择左侧节点后查看详情和子级。"
        />
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-muted hover:text-foreground"
          onClick={() => onSelectNode(null)}
        >
          <HomeIcon className="size-3.5" />
          根目录
        </button>
        {breadcrumb.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3 text-muted-foreground/60" />
            <button
              type="button"
              className={cn(
                "rounded-md px-1.5 py-1 transition hover:bg-muted hover:text-foreground",
                index === breadcrumb.length - 1 && "font-medium text-foreground"
              )}
              onClick={() => onSelectNode(item.id)}
            >
              {item.label}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                {selectedNode.children.length > 0 ? (
                  <FolderOpenIcon className="size-5 text-primary" />
                ) : (
                  <TagIcon className="size-4 text-primary" />
                )}
                <h3 className="text-base font-semibold text-foreground">
                  {selectedNode.label}
                </h3>
              </div>
              <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {selectedNode.dict_key}
              </code>
              <DictStatusBadge status={selectedNode.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>类型：{selectedNode.dict_type}</span>
              <span>值：{selectedNode.dict_value}</span>
              <span>值类型：{selectedNode.value_type}</span>
              <span>排序：{selectedNode.sort}</span>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {selectedNode.description || "当前节点暂无补充说明。"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEdit(selectedNode)}
            >
              <Edit3Icon />
              编辑
            </Button>
            <Button size="sm" onClick={() => onOpenAddChild(selectedNode.id)}>
              <PlusIcon />
              添加子级
            </Button>
          </div>
        </div>
      </div>

      <DataGrid
        table={table}
        recordCount={childItems.length}
        isLoading={isFetching}
        loadingMode="spinner"
        loadingMessage="正在同步字典列表..."
        emptyMessage={
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <TagIcon className="size-8 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">当前节点下暂无子级</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                可继续添加子级节点
              </p>
            </div>
            <Button size="sm" onClick={() => onOpenAddChild(selectedNode.id)}>
              <PlusIcon />
              添加子级
            </Button>
          </div>
        }
        tableLayout={{
          columnsMovable: false,
        }}
      >
        <div className="w-full space-y-2.5">
          <div className="space-y-1 px-1">
            <h4 className="text-sm font-semibold text-foreground">直接子级</h4>
            <p className="text-sm text-muted-foreground">
              仅展示当前节点的直属子项
            </p>
          </div>
          <DataGridContainer className="[&_svg.animate-spin]:text-primary">
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
        </div>
      </DataGrid>
    </section>
  )
}
