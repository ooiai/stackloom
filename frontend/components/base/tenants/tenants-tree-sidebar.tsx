"use client"

import { useCallback, useEffect, useRef } from "react"

import type { TenantTreeNode } from "@/components/base/tenants/helpers"
import { ScrollArea } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantData } from "@/types/base.types"
import {
  Building2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Edit3Icon,
  EllipsisIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

interface SiblingState {
  items: TenantData[]
  total: number
  pageIndex: number
  totalPages: number
  isFetching: boolean
}

interface TenantsTreeSidebarProps {
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
  expandedIds: Set<string>
  childStateByParent: Map<string, SiblingState>
  isSearchMode: boolean
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
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}

function PaginationFooter({
  pageIndex,
  totalPages,
  onPageChange,
}: {
  pageIndex: number
  totalPages: number
  onPageChange: (pageIndex: number) => void
}) {
  const { t } = useI18n()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
      <Button
        variant="outline"
        size="sm"
        disabled={pageIndex === 0}
        onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
      >
        {t("common.pagination.previous")}
      </Button>
      <span className="text-xs text-muted-foreground">
        {t("tenants.sidebar.pageIndicator", {
          current: pageIndex + 1,
          total: totalPages,
        })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={pageIndex >= totalPages - 1}
        onClick={() => onPageChange(Math.min(totalPages - 1, pageIndex + 1))}
      >
        {t("common.pagination.next")}
      </Button>
    </div>
  )
}

function TenantNodeActions({
  permissions,
  tenant,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: {
  permissions: TenantsTreeSidebarProps["permissions"]
  tenant: TenantData
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}) {
  const { t } = useI18n()
  const hasNodeActions =
    permissions.canAddChild || permissions.canEdit || permissions.canDelete(tenant)

  if (!hasNodeActions) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon-xs" variant="ghost" />}>
        <EllipsisIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        {permissions.canAddChild ? (
          <DropdownMenuItem onClick={() => onOpenAddChild(tenant.id)}>
            <PlusIcon />
            {t("common.actions.addChild")}
          </DropdownMenuItem>
        ) : null}
        {permissions.canEdit ? (
          <DropdownMenuItem onClick={() => onOpenEdit(tenant)}>
            <Edit3Icon />
            {t("common.actions.edit")}
          </DropdownMenuItem>
        ) : null}
        {(permissions.canAddChild || permissions.canEdit) &&
        permissions.canDelete(tenant) ? (
          <DropdownMenuSeparator />
        ) : null}
        {permissions.canDelete(tenant) ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(tenant)}>
            <Trash2Icon />
            {t("common.actions.delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TenantTreeNodeItem({
  permissions,
  node,
  selectedNodeId,
  expandedIds,
  childStateByParent,
  onToggleExpand,
  onSelectNode,
  onChildPageChange,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
  depth = 0,
}: {
  permissions: TenantsTreeSidebarProps["permissions"]
  node: TenantTreeNode
  selectedNodeId: string | null
  expandedIds: Set<string>
  childStateByParent: Map<string, SiblingState>
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onChildPageChange: (parentId: string, pageIndex: number) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
  depth?: number
}) {
  const { t } = useI18n()
  const isSelected = selectedNodeId === node.id
  const isExpanded = expandedIds.has(node.id)
  const siblingState = childStateByParent.get(node.id)
  const hasChildren = node.has_children

  return (
    <div>
      <div
        className={cn(
          "group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted/70"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(
              "size-5 shrink-0 rounded p-0 text-muted-foreground hover:bg-accent/50",
              !hasChildren && "invisible"
            )}
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand(node.id)
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )
            ) : null}
          </Button>
          {hasChildren ? (
            isExpanded ? (
              <FolderOpenIcon
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
            ) : (
              <FolderIcon
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
            )
          ) : (
            <Building2Icon
              className={cn(
                "size-3.5 shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
          <div className="min-w-0 space-y-px">
            <div className="truncate leading-5 font-medium">{node.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {node.slug}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {hasChildren ? (
            <span className="text-[11px] text-muted-foreground">
              {t("tenants.table.hasChildren")}
            </span>
          ) : null}
          <TenantNodeActions
            permissions={permissions}
            tenant={node}
            onOpenAddChild={onOpenAddChild}
            onOpenEdit={onOpenEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      {isExpanded ? (
        <div>
          {siblingState?.isFetching && siblingState.items.length === 0 ? (
            <div
              className="flex items-center gap-2 py-2 text-xs text-muted-foreground"
              style={{ paddingLeft: `${depth * 16 + 40}px` }}
            >
              <RefreshCwIcon className="size-3.5 animate-spin" />
              {t("common.loading.default")}
            </div>
          ) : null}

          {node.children.map((child) => (
            <TenantTreeNodeItem
              key={child.id}
              permissions={permissions}
              node={child}
              selectedNodeId={selectedNodeId}
              expandedIds={expandedIds}
              childStateByParent={childStateByParent}
              onToggleExpand={onToggleExpand}
              onSelectNode={onSelectNode}
              onChildPageChange={onChildPageChange}
              onOpenAddChild={onOpenAddChild}
              onOpenEdit={onOpenEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}

          {siblingState && siblingState.totalPages > 1 ? (
            <div
              className="flex items-center gap-2 py-2 text-xs text-muted-foreground"
              style={{ paddingLeft: `${depth * 16 + 40}px` }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={siblingState.pageIndex === 0}
                onClick={() =>
                  onChildPageChange(node.id, Math.max(0, siblingState.pageIndex - 1))
                }
              >
                {t("common.pagination.previous")}
              </Button>
              <span>
                {t("tenants.sidebar.pageIndicator", {
                  current: siblingState.pageIndex + 1,
                  total: siblingState.totalPages,
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={siblingState.pageIndex >= siblingState.totalPages - 1}
                onClick={() =>
                  onChildPageChange(
                    node.id,
                    Math.min(siblingState.totalPages - 1, siblingState.pageIndex + 1)
                  )
                }
              >
                {t("common.pagination.next")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SearchResultItem({
  permissions,
  tenant,
  pathLabel,
  selectedNodeId,
  onSelectNode,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: {
  permissions: TenantsTreeSidebarProps["permissions"]
  tenant: TenantData
  pathLabel?: string
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}) {
  const isSelected = selectedNodeId === tenant.id

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted/70"
      )}
      onClick={() => onSelectNode(tenant.id)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {tenant.has_children ? (
          <FolderOpenIcon
            className={cn(
              "size-4 shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        ) : (
          <Building2Icon
            className={cn(
              "size-3.5 shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
        <div className="min-w-0 space-y-1">
          <div className="truncate font-medium">{tenant.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {pathLabel || tenant.slug}
          </div>
        </div>
      </div>
      <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <TenantNodeActions
          permissions={permissions}
          tenant={tenant}
          onOpenAddChild={onOpenAddChild}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

export function TenantsTreeSidebar({
  permissions,
  treeSearch,
  tree,
  searchResults,
  searchResultPaths,
  selectedNodeId,
  expandedIds,
  childStateByParent,
  isSearchMode,
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
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: TenantsTreeSidebarProps) {
  const { t } = useI18n()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  const getViewport = useCallback(() => {
    return scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null
  }, [])

  const rememberScroll = useCallback(() => {
    scrollPositionRef.current = getViewport()?.scrollTop ?? 0
  }, [getViewport])

  useEffect(() => {
    const viewport = getViewport()
    if (viewport) {
      viewport.scrollTop = scrollPositionRef.current
    }
  }, [
    getViewport,
    rootPageIndex,
    searchPageIndex,
    selectedNodeId,
    tree.length,
    searchResults.length,
  ])

  const handleSelectNode = useCallback(
    (id: string | null) => {
      rememberScroll()
      onSelectNode(id)
    },
    [onSelectNode, rememberScroll]
  )

  const handleRootPageChange = useCallback(
    (pageIndex: number) => {
      scrollPositionRef.current = 0
      onRootPageChange(pageIndex)
    },
    [onRootPageChange]
  )

  const handleSearchPageChange = useCallback(
    (pageIndex: number) => {
      scrollPositionRef.current = 0
      onSearchPageChange(pageIndex)
    },
    [onSearchPageChange]
  )

  return (
    <aside className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {t("tenants.sidebar.title")}
          </p>
          <p className="text-[12px] leading-5 text-muted-foreground">
            {t("tenants.sidebar.subtitle")}
          </p>
        </div>
        {permissions.canCreateRoot ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            title={t("tenants.sidebar.addRoot")}
            onClick={onOpenCreateRoot}
          >
            <PlusIcon />
          </Button>
        ) : null}
      </div>
      <div className="border-b border-border/60 px-4 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={treeSearch}
            onChange={(event) => onTreeSearchChange(event.target.value)}
            placeholder={t("tenants.sidebar.searchPlaceholder")}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea ref={scrollAreaRef} className="h-140">
        <div className="space-y-0.5 p-2.5">
          {isInitialLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              {t("common.loading.loadingTree")}
            </div>
          ) : isSearchMode ? (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Building2Icon className="size-8 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {t("tenants.sidebar.emptySearchTitle")}
                  </p>
                  <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                    {t("tenants.sidebar.emptySearchDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-1 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {t("tenants.sidebar.searchResults")}
                </div>
                {searchResults.map((tenant) => (
                  <SearchResultItem
                    key={tenant.id}
                    permissions={permissions}
                    tenant={tenant}
                    pathLabel={searchResultPaths.get(tenant.id)}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleSelectNode}
                    onOpenAddChild={onOpenAddChild}
                    onOpenEdit={onOpenEdit}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Building2Icon className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("tenants.sidebar.emptyDefaultTitle")}
                </p>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  {t("tenants.sidebar.emptyDefaultDescription")}
                </p>
              </div>
              {permissions.canCreateRoot ? (
                <Button size="sm" onClick={onOpenCreateRoot}>
                  <PlusIcon />
                  {t("tenants.sidebar.create")}
                </Button>
              ) : null}
            </div>
          ) : (
            tree.map((node) => (
              <TenantTreeNodeItem
                key={node.id}
                permissions={permissions}
                node={node}
                selectedNodeId={selectedNodeId}
                expandedIds={expandedIds}
                childStateByParent={childStateByParent}
                onToggleExpand={onToggleExpand}
                onSelectNode={handleSelectNode}
                onChildPageChange={onChildPageChange}
                onOpenAddChild={onOpenAddChild}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {isSearchMode ? (
        <PaginationFooter
          pageIndex={searchPageIndex}
          totalPages={totalSearchPages}
          onPageChange={handleSearchPageChange}
        />
      ) : (
        <PaginationFooter
          pageIndex={rootPageIndex}
          totalPages={totalRootPages}
          onPageChange={handleRootPageChange}
        />
      )}
    </aside>
  )
}
