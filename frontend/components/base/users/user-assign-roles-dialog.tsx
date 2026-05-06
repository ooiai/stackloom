"use client"

import { useCallback, useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  ShieldIcon,
} from "lucide-react"

import { Checkbox } from "@/components/reui/checkbox"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import type { UserRoleItemData, UserData } from "@/types/base.types"

interface UserRoleTreeNode extends UserRoleItemData {
  children: UserRoleTreeNode[]
}

const HIDDEN_SYSTEM_ROLE_CODES = new Set(["TENANT"])

function shouldHideAssignableRole(role: UserRoleItemData) {
  return role.tenant_id === null && HIDDEN_SYSTEM_ROLE_CODES.has(role.code)
}

function buildAssignRoleTree(items: UserRoleItemData[]): UserRoleTreeNode[] {
  const sorted = [...items].sort(
    (a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN")
  )
  const nodeMap = new Map<string, UserRoleTreeNode>()
  const roots: UserRoleTreeNode[] = []

  for (const item of sorted) {
    nodeMap.set(item.id, { ...item, children: [] })
  }

  for (const item of sorted) {
    const node = nodeMap.get(item.id)!
    if (item.parent_id && nodeMap.has(item.parent_id)) {
      nodeMap.get(item.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function hasSelectedDescendant(
  node: UserRoleTreeNode,
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

function buildDialogResetKey(
  open: boolean,
  user: UserData | null,
  roles: UserRoleItemData[]
): string {
  const roleSignature = roles
    .map((role) =>
      [
        role.id,
        role.parent_id ?? "root",
        role.tenant_id ?? "system",
        role.sort,
        role.is_assigned ? "assigned" : "unassigned",
      ].join(":")
    )
    .join("|")

  return [user?.id ?? "no-user", open ? "open" : "closed", roleSignature].join(
    "-"
  )
}

interface UserAssignRolesDialogProps {
  open: boolean
  user: UserData | null
  roles: UserRoleItemData[]
  isLoading: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleIds: string[]) => Promise<void>
}

export function UserAssignRolesDialog({
  open,
  user,
  roles,
  isLoading,
  isSaving,
  onOpenChange,
  onSave,
}: UserAssignRolesDialogProps) {
  const resetKey = useMemo(
    () => buildDialogResetKey(open, user, roles),
    [open, roles, user]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 rounded-3xl border border-border/70 bg-background shadow-2xl outline-none">
          <UserAssignRolesDialogContent
            key={resetKey}
            user={user}
            roles={roles}
            isLoading={isLoading}
            isSaving={isSaving}
            onSave={onSave}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface UserAssignRolesDialogContentProps {
  user: UserData | null
  roles: UserRoleItemData[]
  isLoading: boolean
  isSaving: boolean
  onSave: (roleIds: string[]) => Promise<void>
}

function UserAssignRolesDialogContent({
  user,
  roles,
  isLoading,
  isSaving,
  onSave,
}: UserAssignRolesDialogContentProps) {
  const { t } = useI18n()

  const {
    systemTree,
    tenantTree,
    visibleRoleCount,
    initialExpandedIds,
    initialSelectedIds,
  } = useMemo(() => {
    const visibleSystemRoles = roles.filter(
      (role) => role.tenant_id === null && !shouldHideAssignableRole(role)
    )
    const visibleTenantRoles = roles.filter((role) => role.tenant_id !== null)
    const systemTree = buildAssignRoleTree(visibleSystemRoles)
    const tenantTree = buildAssignRoleTree(visibleTenantRoles)

    return {
      systemTree,
      tenantTree,
      visibleRoleCount: visibleSystemRoles.length + visibleTenantRoles.length,
      initialSelectedIds: new Set(
        roles.filter((role) => role.is_assigned).map((role) => role.id)
      ),
      initialExpandedIds: new Set<string>(),
    }
  }, [roles])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialExpandedIds)
  )

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

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
          <ShieldIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <DialogPrimitive.Title className="text-base font-semibold">
            {t("users.assignRoles.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {user
              ? t("users.assignRoles.description", {
                  username: user.username,
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
        ) : visibleRoleCount === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("users.assignRoles.empty")}
          </p>
        ) : (
          <div className="space-y-5">
            {systemTree.length > 0 ? (
              <RoleCheckboxGroup
                label={t("users.assignRoles.systemRoles")}
                tree={systemTree}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onToggle={toggle}
                onToggleExpand={toggleExpand}
              />
            ) : null}
            {tenantTree.length > 0 ? (
              <RoleCheckboxGroup
                label={t("users.assignRoles.tenantRoles")}
                tree={tenantTree}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onToggle={toggle}
                onToggleExpand={toggleExpand}
              />
            ) : null}
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

interface RoleCheckboxGroupProps {
  label: string
  tree: UserRoleTreeNode[]
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function RoleCheckboxGroup({
  label,
  tree,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: RoleCheckboxGroupProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="space-y-0.5">
        {tree.map((node) => (
          <RoleCheckboxTreeNode
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
    </div>
  )
}

interface RoleCheckboxTreeNodeProps {
  node: UserRoleTreeNode
  depth: number
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
}

function RoleCheckboxTreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
}: RoleCheckboxTreeNodeProps) {
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
                <ShieldIcon className="size-3.5 shrink-0 text-muted-foreground" />
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
            <RoleCheckboxTreeNode
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
