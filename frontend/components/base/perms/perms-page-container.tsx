"use client"

import { useMemo } from "react"

import { createPermColumns } from "@/components/base/perms/perms-page-columns"
import { PermsDetailPanel } from "@/components/base/perms/perms-detail-panel"
import { PermsPageHeader } from "@/components/base/perms/perms-page-header"
import { PermsTreeSidebar } from "@/components/base/perms/perms-tree-sidebar"
import type { PermTreeNode } from "@/components/base/perms/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { PermData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface PermsPageViewProps {
  treeSearch: string
  tree: PermTreeNode[]
  selectedNodeId: string | null
  selectedNode: PermTreeNode | null
  breadcrumb: PermTreeNode[]
  children: PermData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (perm: PermData) => void
  onDelete: (perm: PermData) => void
}

export function PermsPageView({
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
}: PermsPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () =>
      createPermColumns({
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
      <PermsPageHeader
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreateRoot={onOpenCreateRoot}
      />

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <PermsTreeSidebar
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

        <PermsDetailPanel
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
