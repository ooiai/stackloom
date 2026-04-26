"use client"

import { useMemo } from "react"

import { createDictColumns } from "@/components/base/dicts/dicts-page-columns"
import { DictsDetailPanel } from "@/components/base/dicts/dicts-detail-panel"
import { DictsPageHeader } from "@/components/base/dicts/dicts-page-header"
import { DictsTreeSidebar } from "@/components/base/dicts/dicts-tree-sidebar"
import type { DictTreeNode } from "@/lib/dicts"
import type { DictData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface DictsPageViewProps {
  treeSearch: string
  total: number
  loadedCount: number
  tree: DictTreeNode[]
  filteredTree: DictTreeNode[]
  selectedNodeId: string | null
  selectedNode: DictTreeNode | null
  breadcrumb: DictTreeNode[]
  children: DictData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  isTreeTruncated: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (dict: DictData) => void
  onDelete: (dict: DictData) => void
}

export function DictsPageView({
  treeSearch,
  total,
  loadedCount,
  tree,
  filteredTree,
  selectedNodeId,
  selectedNode,
  breadcrumb,
  children,
  expandedIds,
  isFetching,
  isInitialLoading,
  isTreeTruncated,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onRefresh,
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: DictsPageViewProps) {
  const columns = useMemo(
    () =>
      createDictColumns({
        tree,
        onSelectNode,
        onOpenAddChild,
        onOpenEdit,
        onDelete,
      }),
    [onDelete, onOpenAddChild, onOpenEdit, onSelectNode, tree]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: children,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full space-y-5 self-start">
      <DictsPageHeader
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreateRoot={onOpenCreateRoot}
      />

      {isTreeTruncated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          当前共返回 {total} 条字典数据，前端本次加载了 {loadedCount}{" "}
          条用于构建树。若字典量继续增大，需要补后端树形接口。
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <DictsTreeSidebar
          treeSearch={treeSearch}
          filteredTree={filteredTree}
          selectedNodeId={selectedNodeId}
          expandedIds={expandedIds}
          isInitialLoading={isInitialLoading}
          onTreeSearchChange={onTreeSearchChange}
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
          onOpenCreateRoot={onOpenCreateRoot}
          onOpenAddChild={onOpenAddChild}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />

        <DictsDetailPanel
          selectedNode={selectedNode}
          breadcrumb={breadcrumb}
          childItems={children}
          table={table}
          isFetching={isFetching}
          onSelectNode={onSelectNode}
          onOpenEdit={onOpenEdit}
          onOpenAddChild={onOpenAddChild}
        />
      </div>
    </div>
  )
}
