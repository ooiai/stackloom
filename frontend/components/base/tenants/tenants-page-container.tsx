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
  searchResults: TenantData[]
  searchResultPaths: Map<string, string>
  selectedNodeId: string | null
  selectedNode: TenantData | null
  breadcrumb: TenantData[]
  children: TenantData[]
  expandedIds: Set<string>
  childStateByParent: Map<
    string,
    {
      items: TenantData[]
      total: number
      pageIndex: number
      totalPages: number
      isFetching: boolean
    }
  >
  isSearchMode: boolean
  isFetching: boolean
  isInitialLoading: boolean
  rootPageIndex: number
  totalRootPages: number
  searchPageIndex: number
  totalSearchPages: number
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRootPageChange: (pageIndex: number) => void
  onSearchPageChange: (pageIndex: number) => void
  onChildPageChange: (parentId: string, pageIndex: number) => void
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
  searchResults,
  searchResultPaths,
  selectedNodeId,
  selectedNode,
  breadcrumb,
  children,
  expandedIds,
  childStateByParent,
  isSearchMode,
  isFetching,
  isInitialLoading,
  rootPageIndex,
  totalRootPages,
  searchPageIndex,
  totalSearchPages,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onRootPageChange,
  onSearchPageChange,
  onChildPageChange,
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
        onSelectNode,
        onOpenAddChild,
        onOpenEdit,
        onDelete,
      }),
    [onDelete, onOpenAddChild, onOpenEdit, onSelectNode, permissions, t]
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
          searchResults={searchResults}
          searchResultPaths={searchResultPaths}
          selectedNodeId={selectedNodeId}
          expandedIds={expandedIds}
          childStateByParent={childStateByParent}
          isSearchMode={isSearchMode}
          isInitialLoading={isInitialLoading}
          rootPageIndex={rootPageIndex}
          totalRootPages={totalRootPages}
          searchPageIndex={searchPageIndex}
          totalSearchPages={totalSearchPages}
          onTreeSearchChange={onTreeSearchChange}
          onToggleExpand={onToggleExpand}
          onSelectNode={onSelectNode}
          onRootPageChange={onRootPageChange}
          onSearchPageChange={onSearchPageChange}
          onChildPageChange={onChildPageChange}
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
