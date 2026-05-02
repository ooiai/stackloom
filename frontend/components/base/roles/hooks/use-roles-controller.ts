"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateRoleParam,
  buildRoleBreadcrumb,
  buildUpdateRoleParam,
  findRoleNode,
} from "@/components/base/roles/helpers"
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

  const [rawSelectedNodeId, setRawSelectedNodeId] = useState<string | null>(
    searchParams.get("node")
  )
  const [treeSearch, setTreeSearch] = useState(searchParams.get("tree") ?? "")
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(
    new Set()
  )
  const [sheet, setSheet] = useState<RoleSheetState>(DEFAULT_SHEET_STATE)

  const treeQuery = useQuery({
    queryKey: ["base", "roles", "tree", treeSearch.trim()],
    queryFn: () =>
      roleApi.tree({
        keyword: treeSearch.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(() => treeQuery.data?.items ?? [], [treeQuery.data?.items])
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
    queryKey: ["base", "roles", "children", selectedNodeId],
    queryFn: () =>
      roleApi.children({
        parent_id: selectedNodeId,
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

  const openCreateRoot = useCallback(() => {
    setSheet({
      mode: "create",
      open: true,
      role: null,
      parent: null,
    })
  }, [])

  const openAddChild = useCallback(
    (parentId: string) => {
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
    [selectedNode, tree]
  )

  const openEdit = useCallback(
    (role: RoleData) => {
      setSheet({
        mode: "update",
        open: true,
        role,
        parent:
          (role.parent_id ? findRoleNode(tree, role.parent_id) : null) ??
          (selectedNode?.id === role.parent_id ? selectedNode : null),
      })
    },
    [selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: RoleFormValues) => {
      if (sheet.mode === "create") {
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.role) {
        return
      }

      await updateMutation.mutateAsync({
        role: sheet.role,
        values,
      })
    },
    [createMutation, sheet.role, sheet.mode, updateMutation]
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
      const treeNode = findRoleNode(tree, role.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0

      dialog.show({
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
    [deleteMutation, dialog, t, tree]
  )

  return {
    view: {
      treeSearch,
      tree,
      selectedNodeId,
      selectedNode,
      breadcrumb,
      children,
      expandedIds: new Set(manualExpandedIds),
      isFetching: treeQuery.isFetching || childrenQuery.isFetching,
      isInitialLoading: treeQuery.isLoading,
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
