"use client"

import { useCallback, useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  KeyIcon,
} from "lucide-react"

import { Checkbox } from "@/components/reui/checkbox"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { RoleData, PermTreeNodeData } from "@/types/base.types"

function hasSelectedDescendant(
  node: PermTreeNodeData,
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

function buildTreeSignature(nodes: PermTreeNodeData[]): string {
  const parts: string[] = []

  const walk = (items: PermTreeNodeData[]) => {
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
  perms: PermTreeNodeData[],
  assignedIds: string[]
): string {
  const treeSignature = buildTreeSignature(perms)
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
  perms: PermTreeNodeData[],
  assignedIds: string[]
): {
  initialSelectedIds: Set<string>
  initialExpandedIds: Set<string>
} {
  const { nodeMap } = buildTreeMaps(perms)
  const initialSelectedIds = new Set<string>()

  // Add only the exact IDs that exist in the current tree.
  // Do NOT propagate downward — newly added children must not be auto-selected.
  for (const id of assignedIds) {
    if (nodeMap.has(id)) {
      initialSelectedIds.add(id)
    }
  }

  // Post-order reconciliation: a parent is fully selected iff ALL its children
  // are selected; otherwise remove it so it renders as indeterminate.
  const reconcileParents = (nodes: PermTreeNodeData[]) => {
    for (const node of nodes) {
      if (node.children.length === 0) continue
      reconcileParents(node.children)
      const allChildrenSelected = node.children.every((c) =>
        initialSelectedIds.has(c.id)
      )
      if (allChildrenSelected) {
        initialSelectedIds.add(node.id)
      } else {
        initialSelectedIds.delete(node.id)
      }
    }
  }

  reconcileParents(perms)

  return {
    initialSelectedIds,
    initialExpandedIds: new Set<string>(),
  }
}

interface RoleAssignPermsDialogProps {
  open: boolean
  role: RoleData | null
  perms: PermTreeNodeData[]
  assignedIds: string[]
  isLoading: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (ids: string[]) => Promise<void>
}

export function RoleAssignPermsDialog({
  open,
  role,
  perms,
  assignedIds,
  isLoading,
  isSaving,
  onOpenChange,
  onSave,
}: RoleAssignPermsDialogProps) {
  const resetKey = useMemo(
    () => buildDialogResetKey(open, role, perms, assignedIds),
    [open, role, perms, assignedIds]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 rounded-3xl border border-border/70 bg-background shadow-2xl outline-none">
          <RoleAssignPermsDialogContent
            key={resetKey}
            role={role}
            perms={perms}
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

interface RoleAssignPermsDialogContentProps {
  role: RoleData | null
  perms: PermTreeNodeData[]
  assignedIds: string[]
  isLoading: boolean
  isSaving: boolean
  onSave: (ids: string[]) => Promise<void>
}

function RoleAssignPermsDialogContent({
  role,
  perms,
  assignedIds,
  isLoading,
  isSaving,
  onSave,
}: RoleAssignPermsDialogContentProps) {
  const { t } = useI18n()

  const { initialSelectedIds, initialExpandedIds, nodeMap, parentMap } =
    useMemo(() => {
      const { initialSelectedIds, initialExpandedIds } = buildInitialTreeState(
        perms,
        assignedIds
      )
      const { nodeMap, parentMap } = buildTreeMaps(perms)

      return {
        initialSelectedIds,
        initialExpandedIds,
        nodeMap,
        parentMap,
      }
    }, [perms, assignedIds])

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
          <KeyIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <DialogPrimitive.Title className="text-base font-semibold">
            {t("roles.assignPerms.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {role
              ? t("roles.assignPerms.description", {
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
        ) : perms.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("roles.assignPerms.empty")}
          </p>
        ) : (
          <div className="space-y-5">
            <PermCheckboxGroup
              tree={perms}
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

interface PermCheckboxGroupProps {
  tree: PermTreeNodeData[]
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function PermCheckboxGroup({
  tree,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: PermCheckboxGroupProps) {
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <PermCheckboxTreeNode
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

interface PermCheckboxTreeNodeProps {
  node: PermTreeNodeData
  depth: number
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function PermCheckboxTreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: PermCheckboxTreeNodeProps) {
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
                <KeyIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {node.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {node.description ?? node.code}
            </p>
          </div>
        </label>
      </div>

      {isExpanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <PermCheckboxTreeNode
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
