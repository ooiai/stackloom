"use client"

import { useMemo } from "react"

import { createMenuColumns } from "@/components/base/menus/menus-page-columns"
import { MenusDetailPanel } from "@/components/base/menus/menus-detail-panel"
import { MenusPageHeader } from "@/components/base/menus/menus-page-header"
import { MenusTreeSidebar } from "@/components/base/menus/menus-tree-sidebar"
import type { MenuTreeNode } from "@/components/base/menus/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { MenuData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface MenusPageViewProps {
  permissions: {
    canCreateRoot: boolean
    canAddChild: boolean
    canEdit: boolean
    canDelete: (menu: MenuData) => boolean
    hasAnyNodeAction: boolean
  }
  treeSearch: string
  tree: MenuTreeNode[]
  selectedNodeId: string | null
  selectedNode: MenuTreeNode | null
  breadcrumb: MenuTreeNode[]
  children: MenuData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (menu: MenuData) => void
  onOpenCopy: (menu: MenuData) => void
  onDelete: (menu: MenuData) => void
}

export function MenusPageView({
  permissions,
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
  onOpenCopy,
  onDelete,
}: MenusPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () =>
        createMenuColumns({
          permissions,
          t,
        tree,
        onSelectNode,
        onOpenAddChild,
        onOpenEdit,
        onOpenCopy,
        onDelete,
      }),
    [onDelete, onOpenAddChild, onOpenCopy, onOpenEdit, onSelectNode, permissions, t, tree]
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
      <MenusPageHeader
        canCreateRoot={permissions.canCreateRoot}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreateRoot={onOpenCreateRoot}
      />

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <MenusTreeSidebar
          permissions={permissions}
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

        <MenusDetailPanel
          permissions={permissions}
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
