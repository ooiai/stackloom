"use client"

import { useMemo } from "react"

import { createRoleColumns } from "@/components/base/roles/roles-page-columns"
import { RolesDetailPanel } from "@/components/base/roles/roles-detail-panel"
import { RolesPageHeader } from "@/components/base/roles/roles-page-header"
import { RolesTreeSidebar } from "@/components/base/roles/roles-tree-sidebar"
import type { RoleTreeNode } from "@/components/base/roles/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { RoleData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface RolesPageViewProps {
  treeSearch: string
  tree: RoleTreeNode[]
  selectedNodeId: string | null
  selectedNode: RoleTreeNode | null
  breadcrumb: RoleTreeNode[]
  children: RoleData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  showNonBuiltin: boolean
  onToggleShowNonBuiltin: () => void
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (role: RoleData) => void
  onDelete: (role: RoleData) => void
}

export function RolesPageView({
  treeSearch,
  tree,
  selectedNodeId,
  selectedNode,
  breadcrumb,
  children,
  expandedIds,
  isFetching,
  isInitialLoading,
  showNonBuiltin,
  onToggleShowNonBuiltin,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onRefresh,
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: RolesPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () =>
      createRoleColumns({
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
      <RolesPageHeader
        isFetching={isFetching}
        showNonBuiltin={showNonBuiltin}
        onRefresh={onRefresh}
        onOpenCreateRoot={onOpenCreateRoot}
        onToggleShowNonBuiltin={onToggleShowNonBuiltin}
      />

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <RolesTreeSidebar
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

        <RolesDetailPanel
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
