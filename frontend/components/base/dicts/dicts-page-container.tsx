"use client"

import { useMemo } from "react"

import { createDictColumns } from "@/components/base/dicts/dicts-page-columns"
import { DictsDetailPanel } from "@/components/base/dicts/dicts-detail-panel"
import { DictsPageHeader } from "@/components/base/dicts/dicts-page-header"
import { DictsTreeSidebar } from "@/components/base/dicts/dicts-tree-sidebar"
import type { DictTreeNode } from "@/components/base/dicts/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { DictData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface DictsPageViewProps {
  treeSearch: string
  tree: DictTreeNode[]
  selectedNodeId: string | null
  selectedNode: DictTreeNode | null
  breadcrumb: DictTreeNode[]
  children: DictData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
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
  tree,
  selectedNodeId,
  selectedNode,
  breadcrumb,
  children,
  expandedIds,
  isFetching,
  isInitialLoading,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onRefresh,
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: DictsPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () =>
      createDictColumns({
        t,
        tree,
        onSelectNode,
        onOpenAddChild,
        onOpenEdit,
        onDelete,
      }),
    [onDelete, onOpenAddChild, onOpenEdit, onSelectNode, t, tree]
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

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <DictsTreeSidebar
          treeSearch={treeSearch}
          tree={tree}
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
