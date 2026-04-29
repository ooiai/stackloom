"use client"

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

function TenantTreeNodeItem({
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-xs" variant="ghost" />}
            >
              <EllipsisIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={() => onOpenAddChild(node.id)}>
                <PlusIcon />
                {t("common.actions.addChild")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenEdit(node)}>
                <Edit3Icon />
                {t("common.actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(node)}
              >
                <Trash2Icon />
                {t("common.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isExpanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <TenantTreeNodeItem
              key={child.id}
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

export function TenantsTreeSidebar(props: {
  treeSearch: string
  tree: TenantTreeNode[]
  selectedNodeId: string | null
  expandedIds: Set<string>
  isInitialLoading: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (tenant: TenantData) => void
  onDelete: (tenant: TenantData) => void
}) {
  const { t } = useI18n()
  const {
    treeSearch,
    tree,
    selectedNodeId,
    expandedIds,
    isInitialLoading,
    onTreeSearchChange,
    onToggleExpand,
    onSelectNode,
    onOpenCreateRoot,
    onOpenAddChild,
    onOpenEdit,
    onDelete,
  } = props

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
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          title={t("tenants.sidebar.addRoot")}
          onClick={onOpenCreateRoot}
        >
          <PlusIcon />
        </Button>
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
      <ScrollArea className="h-140">
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
              {!treeSearch.trim() ? (
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
    </aside>
  )
}
