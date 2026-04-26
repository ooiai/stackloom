"use client"

import type { DictTreeNode } from "@/components/base/dicts/helpers"
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
import type { DictData } from "@/types/base.types"
import {
  BookMarkedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Edit3Icon,
  EllipsisIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

interface DictsTreeSidebarProps {
  treeSearch: string
  tree: DictTreeNode[]
  selectedNodeId: string | null
  expandedIds: Set<string>
  isInitialLoading: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (dict: DictData) => void
  onDelete: (dict: DictData) => void
}

function DictTreeNodeItem({
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
  node: DictTreeNode
  selectedNodeId: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (dict: DictData) => void
  onDelete: (dict: DictData) => void
  depth?: number
}) {
  const isSelected = selectedNodeId === node.id
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div>
      <div
        className={cn(
          "group flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background",
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
          </button>

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
            <TagIcon
              className={cn(
                "size-3.5 shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}

          <div className="min-w-0">
            <div className="truncate font-medium">{node.label}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {node.dict_key}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                添加子级
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenEdit(node)}>
                <Edit3Icon />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(node)}
              >
                <Trash2Icon />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <DictTreeNodeItem
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

export function DictsTreeSidebar({
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
}: DictsTreeSidebarProps) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">字典树</p>
          <p className="text-xs text-muted-foreground">
            从左侧浏览层级并选中当前节点。
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          title="添加根节点"
          onClick={onOpenCreateRoot}
        >
          <PlusIcon />
        </Button>
      </div>

      <div className="border-b border-border/70 px-4 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={treeSearch}
            onChange={(event) => onTreeSearchChange(event.target.value)}
            placeholder="搜索名称、键或类型"
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="h-140">
        <div className="space-y-0.5 p-2">
          {isInitialLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              正在加载...
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <BookMarkedIcon className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {treeSearch.trim() ? "没有匹配的节点" : "暂无数据"}
                </p>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  {treeSearch.trim()
                    ? "换个关键词，或清空搜索"
                    : "先创建根节点，再补充子项"}
                </p>
              </div>
              {!treeSearch.trim() ? (
                <Button size="sm" onClick={onOpenCreateRoot}>
                  <PlusIcon />
                  创建字典
                </Button>
              ) : null}
            </div>
          ) : (
            tree.map((node) => (
              <DictTreeNodeItem
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
