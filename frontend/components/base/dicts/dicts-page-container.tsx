"use client"

import { useMemo } from "react"

import { EntityEmptyState } from "@/components/base/shared/entity-empty-state"
import { DictStatusBadge } from "@/components/base/dicts/dict-status-badge"
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid-column-header"
import { DataGridTable } from "@/components/reui/data-grid-table"
import { ScrollArea, ScrollBar } from "@/components/reui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { formatDateTimeAt } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { DictTreeNode } from "@/lib/dicts"
import { findDictNode } from "@/lib/dicts"
import type { DictData } from "@/types/base.types"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowRightIcon,
  BookMarkedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Edit3Icon,
  EllipsisIcon,
  FolderIcon,
  FolderOpenIcon,
  HomeIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

interface DictsPageViewProps {
  treeSearch: string
  total: number
  loadedCount: number
  tree: DictTreeNode[]
  filteredTree: DictTreeNode[]
  selectedNodeId: string | null
  selectedNode: DictTreeNode | null
  breadcrumb: DictTreeNode[]
  children: DictData[]
  expandedIds: Set<string>
  isFetching: boolean
  isInitialLoading: boolean
  isTreeTruncated: boolean
  onTreeSearchChange: (value: string) => void
  onToggleExpand: (id: string) => void
  onSelectNode: (id: string | null) => void
  onRefresh: () => void
  onOpenCreateRoot: () => void
  onOpenAddChild: (parentId: string) => void
  onOpenEdit: (dict: DictData) => void
  onDelete: (dict: DictData) => void
}

function TreeNodeItem({
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
            <TreeNodeItem
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

export function DictsPageView({
  treeSearch,
  total,
  loadedCount,
  tree,
  filteredTree,
  selectedNodeId,
  selectedNode,
  breadcrumb,
  children,
  expandedIds,
  isFetching,
  isInitialLoading,
  isTreeTruncated,
  onTreeSearchChange,
  onToggleExpand,
  onSelectNode,
  onRefresh,
  onOpenCreateRoot,
  onOpenAddChild,
  onOpenEdit,
  onDelete,
}: DictsPageViewProps) {
  const columns = useMemo<ColumnDef<DictData>[]>(
    () => [
      {
        accessorKey: "label",
        id: "label",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="名称"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => {
          const node = findDictNode(tree, row.original.id)
          const childCount = node?.children.length ?? 0

          return (
            <div className="flex items-center gap-2">
              {childCount > 0 ? (
                <FolderOpenIcon className="size-3.5 text-muted-foreground" />
              ) : (
                <TagIcon className="size-3.5 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {row.original.label}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.original.dict_key}
                </div>
              </div>
              {childCount > 0 ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {childCount} 子项
                </span>
              ) : null}
            </div>
          )
        },
        size: 220,
        enableSorting: false,
      },
      {
        accessorKey: "dict_value",
        id: "dict_value",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="字典值"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => (
          <code className="rounded-md bg-muted px-1.5 py-1 text-xs text-foreground/80">
            {row.original.dict_value}
          </code>
        ),
        size: 150,
        enableSorting: false,
      },
      {
        accessorKey: "value_type",
        id: "value_type",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="值类型"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.value_type}
          </span>
        ),
        size: 110,
        enableSorting: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="状态"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => <DictStatusBadge status={row.original.status} />,
        size: 110,
        enableSorting: false,
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="说明"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.description || "—"}
          </span>
        ),
        size: 260,
        enableSorting: false,
      },
      {
        accessorKey: "updated_at",
        id: "updated_at",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="更新时间"
            column={column}
            className="font-medium"
          />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTimeAt(row.original.updated_at)}
          </span>
        ),
        size: 170,
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => onSelectNode(row.original.id)}>
                <ArrowRightIcon />
                查看子级
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenAddChild(row.original.id)}>
                <PlusIcon />
                添加子级
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                <Edit3Icon />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [onDelete, onOpenAddChild, onOpenEdit, onSelectNode, tree]
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">字典管理</h2>
          <p className="text-sm text-muted-foreground">
            维护树形数据字典，统一组织键值、显示文案和扩展配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCwIcon className={cn(isFetching && "animate-spin")} />
            刷新
          </Button>
          <Button onClick={onOpenCreateRoot}>
            <PlusIcon />
            添加根节点
          </Button>
        </div>
      </div>

      {isTreeTruncated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          当前共返回 {total} 条字典数据，前端本次加载了 {loadedCount}{" "}
          条用于构建树。若字典量继续增大，需要补后端树形接口。
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
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
              ) : filteredTree.length === 0 ? (
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
                      创建首个节点
                    </Button>
                  ) : null}
                </div>
              ) : (
                filteredTree.map((node) => (
                  <TreeNodeItem
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

        <section className="space-y-4">
          {!selectedNode ? (
            <div className="flex min-h-140 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card">
              <EntityEmptyState
                title="选择字典节点"
                description="选择左侧节点后查看详情和子级。"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-muted hover:text-foreground"
                  onClick={() => onSelectNode(null)}
                >
                  <HomeIcon className="size-3.5" />
                  根目录
                </button>
                {breadcrumb.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <ChevronRightIcon className="size-3 text-muted-foreground/60" />
                    <button
                      type="button"
                      className={cn(
                        "rounded-md px-1.5 py-1 transition hover:bg-muted hover:text-foreground",
                        index === breadcrumb.length - 1 &&
                          "font-medium text-foreground"
                      )}
                      onClick={() => onSelectNode(item.id)}
                    >
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        {selectedNode.children.length > 0 ? (
                          <FolderOpenIcon className="size-5 text-primary" />
                        ) : (
                          <TagIcon className="size-4 text-primary" />
                        )}
                        <h3 className="text-base font-semibold text-foreground">
                          {selectedNode.label}
                        </h3>
                      </div>
                      <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {selectedNode.dict_key}
                      </code>
                      <DictStatusBadge status={selectedNode.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span>类型：{selectedNode.dict_type}</span>
                      <span>值：{selectedNode.dict_value}</span>
                      <span>值类型：{selectedNode.value_type}</span>
                      <span>排序：{selectedNode.sort}</span>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {selectedNode.description || "当前节点暂无补充说明。"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenEdit(selectedNode)}
                    >
                      <Edit3Icon />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onOpenAddChild(selectedNode.id)}
                    >
                      <PlusIcon />
                      添加子级
                    </Button>
                  </div>
                </div>
              </div>

              <DataGrid
                table={table}
                recordCount={children.length}
                isLoading={isFetching}
                loadingMode="spinner"
                loadingMessage="正在同步字典列表..."
                emptyMessage={
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <TagIcon className="size-8 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        当前节点下暂无子级
                      </p>
                      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                        可继续添加子级节点
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onOpenAddChild(selectedNode.id)}
                    >
                      <PlusIcon />
                      添加子级
                    </Button>
                  </div>
                }
                tableLayout={{
                  columnsMovable: false,
                }}
              >
                <div className="w-full space-y-2.5">
                  <div className="space-y-1 px-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      直接子级
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      仅展示当前节点的直属子项
                    </p>
                  </div>
                  <DataGridContainer className="[&_svg.animate-spin]:text-primary">
                    <ScrollArea>
                      <DataGridTable />
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </DataGridContainer>
                </div>
              </DataGrid>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
