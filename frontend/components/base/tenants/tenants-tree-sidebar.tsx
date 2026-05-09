"use client"

import { useCallback, useEffect, useRef } from "react"

import type { TenantTreeNode } from "@/components/base/tenants/helpers"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/reui/scroll-area"
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
  selectedNodeId: string | null
  expandedIds: Set<string>
  isInitialLoading: boolean
  rootPageIndex: number
  totalRootPages: number
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onPageChange: (pageIndex: number) => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}

function TenantTreeNodeItem({
  permissions,
  node,
  selectedNodeId,
  expandedIds,
  onToggleExpand,
  onSelectNode,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
  depth = 0,
}: {
  permissions: TenantsTreeSidebarProps["permissions"]
  node: TenantTreeNode
  selectedNodeId: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
  depth?: number
}) {
  const { t } = useI18n()
  const isSelected = selectedNodeId === node.id
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const hasNodeActions =
    permissions.canAddChild || permissions.canEdit || permissions.canDelete(node)

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
            {/*<div className="truncate text-xs text-muted-foreground">
              {node.slug}
            </div>*/}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {hasChildren ? (
            <span className="text-[11px] text-muted-foreground">
              {node.children.length}
            </span>
          ) : null}
          {hasNodeActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="icon-xs" variant="ghost" />}
              >
                <EllipsisIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                {permissions.canAddChild ? (
                  <DropdownMenuItem onClick={() => onOpenAddChild(node.id)}>
                    <PlusIcon />
                    {t("common.actions.addChild")}
                  </DropdownMenuItem>
                ) : null}
                {permissions.canEdit ? (
                  <DropdownMenuItem onClick={() => onOpenEdit(node)}>
                    <Edit3Icon />
                    {t("common.actions.edit")}
                  </DropdownMenuItem>
                ) : null}
                {(permissions.canAddChild || permissions.canEdit) &&
                permissions.canDelete(node) ? (
                  <DropdownMenuSeparator />
                ) : null}
                {permissions.canDelete(node) ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(node)}
                  >
                    <Trash2Icon />
                    {t("common.actions.delete")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      {isExpanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
              <TenantTreeNodeItem
                key={child.id}
                permissions={permissions}
                node={child}
              selectedNodeId={selectedNodeId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectNode={onSelectNode}
              onOpenAddChild={onOpenAddChild}
              onOpenEdit={onOpenEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TenantsTreeSidebar({
  permissions,
  treeSearch,
  tree,
  selectedNodeId,
  expandedIds,
  isInitialLoading,
  rootPageIndex,
  totalRootPages,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onPageChange,
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: TenantsTreeSidebarProps) {
  const { t } = useI18n()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  const handlePageChangeWithScroll = useCallback(
    (newPageIndex: number) => {
      scrollPositionRef.current = 0
      onPageChange(newPageIndex)
    },
    [onPageChange]
  )

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPositionRef.current
      }
    }
  }, [tree])

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
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Building2Icon className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {treeSearch.trim()
                    ? t("tenants.sidebar.emptySearchTitle")
                    : t("tenants.sidebar.emptyDefaultTitle")}
                </p>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  {treeSearch.trim()
                    ? t("tenants.sidebar.emptySearchDescription")
                    : t("tenants.sidebar.emptyDefaultDescription")}
                </p>
              </div>
              {!treeSearch.trim() && permissions.canCreateRoot ? (
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
                onToggleExpand={onToggleExpand}
                onSelectNode={onSelectNode}
                onOpenAddChild={onOpenAddChild}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>
      {!treeSearch.trim() && totalRootPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={rootPageIndex === 0}
            onClick={() =>
              handlePageChangeWithScroll(Math.max(0, rootPageIndex - 1))
            }
          >
            ← Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {rootPageIndex + 1} of {totalRootPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={rootPageIndex >= totalRootPages - 1}
            onClick={() =>
              handlePageChangeWithScroll(
                Math.min(totalRootPages - 1, rootPageIndex + 1)
              )
            }
          >
            Next →
          </Button>
        </div>
      ) : null}
    </aside>
  )
}
