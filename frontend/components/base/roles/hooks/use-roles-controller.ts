"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateRoleParam,
  buildRoleBreadcrumb,
  buildUpdateRoleParam,
  findRoleNode,
  ROLE_ACTION_PERMS,
} from "@/components/base/roles/helpers"
import { usePermissionAccess } from "@/hooks/use-permission-access"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { roleApi } from "@/stores/base-api"
import type {
  RoleData,
  RoleFormValues,
  RoleMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useRoleAssignMenus } from "./use-role-assign-menus"
import { useRoleAssignPerms } from "./use-role-assign-perms"

interface RoleSheetState {
  mode: RoleMutateMode
  open: boolean
  role: RoleData | null
  parent: RoleData | null
}

const EMPTY_MENUS: RoleData[] = []
const DEFAULT_SHEET_STATE: RoleSheetState = {
  mode: "create",
  open: false,
  role: null,
  parent: null,
}

export function useRolesController() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()
  const { hasPerm, guardPerm } = usePermissionAccess()

  const [sheet, setSheet] = useState<RoleSheetState>(DEFAULT_SHEET_STATE)

  const { assignMenusDialog: rawAssignMenusDialog } = useRoleAssignMenus()
  const { assignPermsDialog: rawAssignPermsDialog } = useRoleAssignPerms()

  const [rawSelectedNodeId, setRawSelectedNodeId] = useState<string | null>(
    searchParams.get("node")
  )
  const [treeSearch, setTreeSearch] = useState(searchParams.get("tree") ?? "")
  const [showNonBuiltin, setShowNonBuiltin] = useState(false)
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(
    new Set()
  )

  const treeQuery = useQuery({
    queryKey: ["base", "roles", "tree", treeSearch.trim(), showNonBuiltin],
    queryFn: () =>
      roleApi.tree({
        keyword: treeSearch.trim() || undefined,
        is_builtin: showNonBuiltin ? undefined : true,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(
    () => treeQuery.data?.items ?? [],
    [treeQuery.data?.items]
  )
  const selectedNode = useMemo(
    () => (rawSelectedNodeId ? findRoleNode(tree, rawSelectedNodeId) : null),
    [rawSelectedNodeId, tree]
  )
  const selectedNodeId = selectedNode?.id ?? null
  const breadcrumb = useMemo(
    () =>
      selectedNodeId ? (buildRoleBreadcrumb(tree, selectedNodeId) ?? []) : [],
    [selectedNodeId, tree]
  )

  const childrenQuery = useQuery({
    queryKey: ["base", "roles", "children", selectedNodeId, showNonBuiltin],
    queryFn: () =>
      roleApi.children({
        parent_id: selectedNodeId,
        is_builtin: showNonBuiltin ? undefined : true,
      }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const children = useMemo(
    () => childrenQuery.data?.items ?? EMPTY_MENUS,
    [childrenQuery.data?.items]
  )

  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedNodeId) {
      params.set("node", selectedNodeId)
    }

    if (treeSearch.trim()) {
      params.set("tree", treeSearch.trim())
    }

    const queryString = params.toString()
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, selectedNodeId, treeSearch])

  const createMutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      await roleApi.create(buildCreateRoleParam(values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "roles"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
      }
      toast.success(t("roles.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      role,
      values,
    }: {
      role: RoleData
      values: RoleFormValues
    }) => {
      await roleApi.update(buildUpdateRoleParam(role.id, values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "roles"] })
      toast.success(t("roles.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (role: RoleData) => {
      const treeNode = findRoleNode(tree, role.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      if (hasChildren) {
        await roleApi.removeCascade(role.id)
      } else {
        await roleApi.remove([role.id])
      }
    },
    onSuccess: async (_, role) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "roles"] })
      if (selectedNodeId === role.id) {
        setRawSelectedNodeId(role.parent_id)
      }
      toast.success(t("roles.toast.deleted"))
    },
  })

  const getDeletePermCode = useCallback(
    (role: RoleData) => {
      const treeNode = findRoleNode(tree, role.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      return hasChildren
        ? ROLE_ACTION_PERMS.removeCascade
        : ROLE_ACTION_PERMS.remove
    },
    [tree]
  )

  const openCreateRoot = useCallback(() => {
    if (!guardPerm(ROLE_ACTION_PERMS.create, { source: "roles.createRoot.open" })) {
      return
    }

    setSheet({
      mode: "create",
      open: true,
      role: null,
      parent: null,
    })
  }, [guardPerm])

  const openAddChild = useCallback(
    (parentId: string) => {
      if (!guardPerm(ROLE_ACTION_PERMS.create, { source: "roles.addChild.open" })) {
        return
      }

      const parentNode =
        findRoleNode(tree, parentId) ??
        (selectedNode?.id === parentId ? selectedNode : null)
      if (!parentNode) {
        return
      }

      setManualExpandedIds((prev) => {
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
      setRawSelectedNodeId(parentId)
      setSheet({
        mode: "create",
        open: true,
        role: null,
        parent: parentNode,
      })
    },
    [guardPerm, selectedNode, tree]
  )

  const openEdit = useCallback(
    (role: RoleData) => {
      if (!guardPerm(ROLE_ACTION_PERMS.update, { source: "roles.update.open" })) {
        return
      }

      setSheet({
        mode: "update",
        open: true,
        role,
        parent:
          (role.parent_id ? findRoleNode(tree, role.parent_id) : null) ??
          (selectedNode?.id === role.parent_id ? selectedNode : null),
      })
    },
    [guardPerm, selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: RoleFormValues) => {
      if (sheet.mode === "create") {
        if (
          !guardPerm(ROLE_ACTION_PERMS.create, {
            source: "roles.create.submit",
          })
        ) {
          return
        }

        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.role) {
        return
      }

      if (
        !guardPerm(ROLE_ACTION_PERMS.update, {
          source: "roles.update.submit",
        })
      ) {
        return
      }

      await updateMutation.mutateAsync({
        role: sheet.role,
        values,
      })
    },
    [createMutation, guardPerm, sheet.role, sheet.mode, updateMutation]
  )

  const toggleExpand = useCallback((id: string) => {
    setManualExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const removeRole = useCallback(
    (role: RoleData) => {
      const deletePermCode = getDeletePermCode(role)
      if (!guardPerm(deletePermCode, { source: "roles.remove.confirm" })) {
        return
      }

      const treeNode = findRoleNode(tree, role.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0

      dialog.show({
        variant: "destructive",
        title: t("roles.dialog.deleteTitle"),
        description: hasChildren
          ? t("roles.dialog.deleteBranchDescription", { name: role.name })
          : t("roles.dialog.deleteLeafDescription", { name: role.name }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(role)
        },
      })
    },
    [deleteMutation, dialog, getDeletePermCode, guardPerm, t, tree]
  )

  const openAssignMenus = useCallback(
    (role: RoleData) => {
      if (
        !guardPerm(ROLE_ACTION_PERMS.assignMenus, {
          source: "roles.assignMenus.open",
        })
      ) {
        return
      }

      rawAssignMenusDialog.onOpen(role)
    },
    [guardPerm, rawAssignMenusDialog]
  )

  const saveAssignMenus = useCallback(
    async (menuIds: string[]) => {
      if (
        !guardPerm(ROLE_ACTION_PERMS.assignMenus, {
          source: "roles.assignMenus.save",
        })
      ) {
        return
      }

      await rawAssignMenusDialog.onSave(menuIds)
    },
    [guardPerm, rawAssignMenusDialog]
  )

  const openAssignPerms = useCallback(
    (role: RoleData) => {
      if (
        !guardPerm(ROLE_ACTION_PERMS.assignPerms, {
          source: "roles.assignPerms.open",
        })
      ) {
        return
      }

      rawAssignPermsDialog.onOpen(role)
    },
    [guardPerm, rawAssignPermsDialog]
  )

  const saveAssignPerms = useCallback(
    async (permIds: string[]) => {
      if (
        !guardPerm(ROLE_ACTION_PERMS.assignPerms, {
          source: "roles.assignPerms.save",
        })
      ) {
        return
      }

      await rawAssignPermsDialog.onSave(permIds)
    },
    [guardPerm, rawAssignPermsDialog]
  )

  const canDeleteRole = useCallback(
    (role: RoleData) => hasPerm(getDeletePermCode(role)),
    [getDeletePermCode, hasPerm]
  )

  const permissions = useMemo(
    () => ({
      canCreateRoot: hasPerm(ROLE_ACTION_PERMS.create),
      canAddChild: hasPerm(ROLE_ACTION_PERMS.create),
      canEdit: hasPerm(ROLE_ACTION_PERMS.update),
      canAssignMenus: hasPerm(ROLE_ACTION_PERMS.assignMenus),
      canAssignPerms: hasPerm(ROLE_ACTION_PERMS.assignPerms),
      canDeleteLeaf: hasPerm(ROLE_ACTION_PERMS.remove),
      canDeleteBranch: hasPerm(ROLE_ACTION_PERMS.removeCascade),
      canDelete: canDeleteRole,
      hasAnyNodeAction:
        hasPerm(ROLE_ACTION_PERMS.create) ||
        hasPerm(ROLE_ACTION_PERMS.update) ||
        hasPerm(ROLE_ACTION_PERMS.assignMenus) ||
        hasPerm(ROLE_ACTION_PERMS.assignPerms) ||
        hasPerm(ROLE_ACTION_PERMS.remove) ||
        hasPerm(ROLE_ACTION_PERMS.removeCascade),
    }),
    [canDeleteRole, hasPerm]
  )

  const assignMenusDialog = useMemo(
    () => ({
      ...rawAssignMenusDialog,
      onOpen: openAssignMenus,
      onSave: saveAssignMenus,
    }),
    [openAssignMenus, rawAssignMenusDialog, saveAssignMenus]
  )

  const assignPermsDialog = useMemo(
    () => ({
      ...rawAssignPermsDialog,
      onOpen: openAssignPerms,
      onSave: saveAssignPerms,
    }),
    [openAssignPerms, rawAssignPermsDialog, saveAssignPerms]
  )

  return {
    assignMenusDialog,
    assignPermsDialog,
    view: {
      permissions,
      treeSearch,
      tree,
      selectedNodeId,
      selectedNode,
      breadcrumb,
      children,
      expandedIds: new Set(manualExpandedIds),
      isFetching: treeQuery.isFetching || childrenQuery.isFetching,
      isInitialLoading: treeQuery.isLoading,
      showNonBuiltin,
      onToggleShowNonBuiltin: () => setShowNonBuiltin((prev) => !prev),
      onTreeSearchChange: setTreeSearch,
      onToggleExpand: toggleExpand,
      onSelectNode: setRawSelectedNodeId,
      onRefresh: () => {
        void treeQuery.refetch()
        if (selectedNodeId) {
          void childrenQuery.refetch()
        }
      },
      onOpenCreateRoot: openCreateRoot,
      onOpenAddChild: openAddChild,
      onOpenEdit: openEdit,
      onDelete: removeRole,
      onOpenAssignMenus: openAssignMenus,
      onOpenAssignPerms: openAssignPerms,
    },
    sheet: {
      ...sheet,
      isSubmitting:
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      onClose: closeSheet,
      onSubmit: submitSheet,
    },
  }
}
