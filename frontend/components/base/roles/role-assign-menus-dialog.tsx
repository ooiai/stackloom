"use client"

import { useCallback, useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  LayoutGridIcon,
} from "lucide-react"

import { Checkbox } from "@/components/reui/checkbox"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { RoleData, MenuTreeNodeData } from "@/types/base.types"

function hasSelectedDescendant(
  node: MenuTreeNodeData,
  selectedIds: Set<string>
): boolean {
  for (const child of node.children) {
    if (
      selectedIds.has(child.id) ||
      hasSelectedDescendant(child, selectedIds)
    ) {
      return true
    }
  }

  return false
}

function buildTreeSignature(nodes: MenuTreeNodeData[]): string {
  const parts: string[] = []

  const walk = (items: MenuTreeNodeData[]) => {
    for (const item of items) {
      parts.push(item.id)
      if (item.children.length > 0) {
        walk(item.children)
      }
    }
  }

  walk(nodes)
  return parts.join(",")
}

function buildDialogResetKey(
  open: boolean,
  role: RoleData | null,
  menus: MenuTreeNodeData[],
  assignedIds: string[]
): string {
  const treeSignature = buildTreeSignature(menus)
  const assignedSignature = [...assignedIds].sort().join(",")

  return [
    role?.id ?? "no-role",
    open ? "open" : "closed",
    treeSignature,
    assignedSignature,
  ].join("-")
}

function buildTreeMaps<T extends { id: string; children: T[] }>(
  nodes: T[],
  parentId: string | null = null,
  nodeMap = new Map<string, T>(),
  parentMap = new Map<string, string | null>()
) {
  for (const node of nodes) {
    nodeMap.set(node.id, node)
    parentMap.set(node.id, parentId)
    if (node.children.length > 0) {
      buildTreeMaps(node.children, node.id, nodeMap, parentMap)
    }
  }
  return { nodeMap, parentMap }
}

function buildInitialTreeState(
  menus: MenuTreeNodeData[],
  assignedIds: string[]
): {
  initialSelectedIds: Set<string>
  initialExpandedIds: Set<string>
} {
  const { nodeMap } = buildTreeMaps(menus)
  const initialSelectedIds = new Set<string>()
  const initialExpandedIds = new Set<string>()

  const selectSubtree = (node: MenuTreeNodeData) => {
    initialSelectedIds.add(node.id)
    for (const child of node.children) {
      selectSubtree(child)
    }
  }

  for (const id of assignedIds) {
    const node = nodeMap.get(id)
    if (!node) {
      continue
    }

    selectSubtree(node)
  }

  const markFullySelectedParents = (nodes: MenuTreeNodeData[]): boolean => {
    let hasAnySelected = false

    for (const node of nodes) {
      const selfSelected = initialSelectedIds.has(node.id)
      const childHasAnySelected = markFullySelectedParents(node.children)
      const hasChildren = node.children.length > 0
      const allChildrenSelected =
        hasChildren &&
        node.children.every((child) => initialSelectedIds.has(child.id))

      if (allChildrenSelected) {
        initialSelectedIds.add(node.id)
      }

      if (
        selfSelected ||
        childHasAnySelected ||
        initialSelectedIds.has(node.id)
      ) {
        hasAnySelected = true
      }
    }

    return hasAnySelected
  }

  markFullySelectedParents(menus)

  return {
    initialSelectedIds,
    initialExpandedIds,
  }
}

interface RoleAssignMenusDialogProps {
  open: boolean
  role: RoleData | null
  menus: MenuTreeNodeData[]
  assignedIds: string[]
  isLoading: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (ids: string[]) => Promise<void>
}

export function RoleAssignMenusDialog({
  open,
  role,
  menus,
  assignedIds,
  isLoading,
  isSaving,
  onOpenChange,
  onSave,
}: RoleAssignMenusDialogProps) {
  const resetKey = useMemo(
    () => buildDialogResetKey(open, role, menus, assignedIds),
    [open, role, menus, assignedIds]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 rounded-3xl border border-border/70 bg-background shadow-2xl outline-none">
          <RoleAssignMenusDialogContent
            key={resetKey}
            role={role}
            menus={menus}
            assignedIds={assignedIds}
            isLoading={isLoading}
            isSaving={isSaving}
            onSave={onSave}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface RoleAssignMenusDialogContentProps {
  role: RoleData | null
  menus: MenuTreeNodeData[]
  assignedIds: string[]
  isLoading: boolean
  isSaving: boolean
  onSave: (ids: string[]) => Promise<void>
}

function RoleAssignMenusDialogContent({
  role,
  menus,
  assignedIds,
  isLoading,
  isSaving,
  onSave,
}: RoleAssignMenusDialogContentProps) {
  const { t } = useI18n()

  const { initialSelectedIds, initialExpandedIds, nodeMap, parentMap } =
    useMemo(() => {
      const { initialSelectedIds, initialExpandedIds } = buildInitialTreeState(
        menus,
        assignedIds
      )
      const { nodeMap, parentMap } = buildTreeMaps(menus)

      return {
        initialSelectedIds,
        initialExpandedIds,
        nodeMap,
        parentMap,
      }
    }, [menus, assignedIds])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialExpandedIds)
  )

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        const isTargetSelected = !next.has(id)

        const node = nodeMap.get(id)
        if (!node) return next

        if (isTargetSelected) {
          // Select the node and all descendants
          const queue = [node]
          while (queue.length > 0) {
            const curr = queue.shift()!
            next.add(curr.id)
            for (const child of curr.children) queue.push(child)
          }

          // Traverse up: if all children are selected, select the parent
          let currId = id
          while (true) {
            const pId = parentMap.get(currId)
            if (!pId) break
            const pNode = nodeMap.get(pId)!
            const allChildrenSelected = pNode.children.every((c) =>
              next.has(c.id)
            )
            if (allChildrenSelected) {
              next.add(pId)
            } else {
              break
            }
            currId = pId
          }
        } else {
          // Deselect the node and all descendants
          const queue = [node]
          while (queue.length > 0) {
            const curr = queue.shift()!
            next.delete(curr.id)
            for (const child of curr.children) queue.push(child)
          }

          // Traverse up: deselect all ancestors
          let currId = id
          while (true) {
            const pId = parentMap.get(currId)
            if (!pId) break
            next.delete(pId)
            currId = pId
          }
        }

        return next
      })
    },
    [nodeMap, parentMap]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSave = async () => {
    await onSave(Array.from(selectedIds))
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 px-6 pt-6 pb-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
          <LayoutGridIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <DialogPrimitive.Title className="text-base font-semibold">
            {t("roles.assignMenus.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {role
              ? t("roles.assignMenus.description", {
                  roleName: role.name,
                })
              : null}
          </DialogPrimitive.Description>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-6 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : menus.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("roles.assignMenus.empty")}
          </p>
        ) : (
          <div className="space-y-5">
            <MenuCheckboxGroup
              tree={menus}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={toggle}
              onToggleExpand={toggleExpand}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-border/50 px-6 py-4">
        <DialogPrimitive.Close
          render={<Button type="button" variant="outline" />}
          disabled={isSaving}
        >
          {t("common.actions.cancel")}
        </DialogPrimitive.Close>
        <Button
          type="button"
          disabled={isLoading || isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving ? <Spinner className="size-4" /> : null}
          {t("common.actions.save")}
        </Button>
      </div>
    </>
  )
}

interface MenuCheckboxGroupProps {
  tree: MenuTreeNodeData[]
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function MenuCheckboxGroup({
  tree,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: MenuCheckboxGroupProps) {
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <MenuCheckboxTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedIds={selectedIds}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  )
}

interface MenuCheckboxTreeNodeProps {
  node: MenuTreeNodeData
  depth: number
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function MenuCheckboxTreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: MenuCheckboxTreeNodeProps) {
  const isSelected = selectedIds.has(node.id)
  const isIndeterminate =
    !isSelected && hasSelectedDescendant(node, selectedIds)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "size-5 shrink-0 rounded p-0 text-muted-foreground hover:bg-accent/50",
            !hasChildren && "invisible"
          )}
          onClick={() => onToggleExpand(node.id)}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </Button>

        <label
          className={cn(
            "flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
            isSelected || isIndeterminate
              ? "border-primary/40 bg-primary/5"
              : "border-border/50 bg-background hover:bg-muted/30"
          )}
        >
          <Checkbox
            checked={isSelected}
            indeterminate={isIndeterminate}
            onCheckedChange={() => onToggle(node.id)}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm leading-5 font-medium">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpenIcon className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
                )
              ) : (
                <LayoutGridIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {node.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {node.code}
            </p>
          </div>
        </label>
      </div>

      {isExpanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <MenuCheckboxTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
