"use client"

import { useMemo } from "react"

import { createTenantColumns } from "@/components/base/tenants/tenants-page-columns"
import { TenantsDetailPanel } from "@/components/base/tenants/tenants-detail-panel"
import { TenantsPageHeader } from "@/components/base/tenants/tenants-page-header"
import { TenantsTreeSidebar } from "@/components/base/tenants/tenants-tree-sidebar"
import type { TenantTreeNode } from "@/components/base/tenants/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantData } from "@/types/base.types"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface TenantsPageViewProps {
  permissions: {
    canCreateRoot: boolean
    canAddChild: boolean
    canEdit: boolean
    canDelete: (tenant: TenantData) => boolean
    hasAnyNodeAction: boolean
  }
  treeSearch: string
  tree: TenantTreeNode[]
  selectedNodeId: string | null
  selectedNode: TenantTreeNode | null
  breadcrumb: TenantTreeNode[]
  children: TenantData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}

export function TenantsPageView({
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
  onDelete,
}: TenantsPageViewProps) {
  const { t } = useI18n()
  const columns = useMemo(
    () =>
        createTenantColumns({
          permissions,
          t,
        tree,
        onSelectNode,
        onOpenAddChild,
        onOpenEdit,
        onDelete,
      }),
    [onDelete, onOpenAddChild, onOpenEdit, onSelectNode, permissions, t, tree]
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
      <TenantsPageHeader
        canCreateRoot={permissions.canCreateRoot}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onOpenCreateRoot={onOpenCreateRoot}
      />

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <TenantsTreeSidebar
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

        <TenantsDetailPanel
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
