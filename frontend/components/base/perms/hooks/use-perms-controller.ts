"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreatePermParam,
  buildPermBreadcrumb,
  buildUpdatePermParam,
  findPermNode,
  PERM_ACTION_PERMS,
} from "@/components/base/perms/helpers"
import { usePermissionAccess } from "@/hooks/use-permission-access"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { permApi } from "@/stores/base-api"
import type {
  PermData,
  PermFormValues,
  PermMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface PermSheetState {
  mode: PermMutateMode
  open: boolean
  perm: PermData | null
  parent: PermData | null
}

const EMPTY_MENUS: PermData[] = []
const DEFAULT_SHEET_STATE: PermSheetState = {
  mode: "create",
  open: false,
  perm: null,
  parent: null,
}

export function usePermsController() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()
  const { hasPerm, guardPerm } = usePermissionAccess()

  const [rawSelectedNodeId, setRawSelectedNodeId] = useState<string | null>(
    searchParams.get("node")
  )
  const [treeSearch, setTreeSearch] = useState(searchParams.get("tree") ?? "")
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(
    new Set()
  )
  const [sheet, setSheet] = useState<PermSheetState>(DEFAULT_SHEET_STATE)

  const treeQuery = useQuery({
    queryKey: ["base", "perms", "tree", treeSearch.trim()],
    queryFn: () =>
      permApi.tree({
        keyword: treeSearch.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(
    () => treeQuery.data?.items ?? [],
    [treeQuery.data?.items]
  )
  const selectedNode = useMemo(
    () => (rawSelectedNodeId ? findPermNode(tree, rawSelectedNodeId) : null),
    [rawSelectedNodeId, tree]
  )
  const selectedNodeId = selectedNode?.id ?? null
  const breadcrumb = useMemo(
    () =>
      selectedNodeId ? (buildPermBreadcrumb(tree, selectedNodeId) ?? []) : [],
    [selectedNodeId, tree]
  )

  const childrenQuery = useQuery({
    queryKey: ["base", "perms", "children", selectedNodeId],
    queryFn: () =>
      permApi.children({
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
    mutationFn: async (values: PermFormValues) => {
      await permApi.create(buildCreatePermParam(values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "perms"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
      }
      toast.success(t("perms.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      perm,
      values,
    }: {
      perm: PermData
      values: PermFormValues
    }) => {
      await permApi.update(buildUpdatePermParam(perm.id, values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "perms"] })
      toast.success(t("perms.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (perm: PermData) => {
      const treeNode = findPermNode(tree, perm.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      if (hasChildren) {
        await permApi.removeCascade(perm.id)
      } else {
        await permApi.remove([perm.id])
      }
    },
    onSuccess: async (_, perm) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "perms"] })
      if (selectedNodeId === perm.id) {
        setRawSelectedNodeId(perm.parent_id)
      }
      toast.success(t("perms.toast.deleted"))
    },
  })

  const getDeletePermCode = useCallback(
    (perm: PermData) => {
      const treeNode = findPermNode(tree, perm.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      return hasChildren
        ? PERM_ACTION_PERMS.removeCascade
        : PERM_ACTION_PERMS.remove
    },
    [tree]
  )

  const openCreateRoot = useCallback(() => {
    if (!guardPerm(PERM_ACTION_PERMS.create, { source: "perms.createRoot.open" })) {
      return
    }

    setSheet({
      mode: "create",
      open: true,
      perm: null,
      parent: null,
    })
  }, [guardPerm])

  const openAddChild = useCallback(
    (parentId: string) => {
      if (!guardPerm(PERM_ACTION_PERMS.create, { source: "perms.addChild.open" })) {
        return
      }

      const parentNode =
        findPermNode(tree, parentId) ??
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
        perm: null,
        parent: parentNode,
      })
    },
    [guardPerm, selectedNode, tree]
  )

  const openEdit = useCallback(
    (perm: PermData) => {
      if (!guardPerm(PERM_ACTION_PERMS.update, { source: "perms.update.open" })) {
        return
      }

      setSheet({
        mode: "update",
        open: true,
        perm,
        parent:
          (perm.parent_id ? findPermNode(tree, perm.parent_id) : null) ??
          (selectedNode?.id === perm.parent_id ? selectedNode : null),
      })
    },
    [guardPerm, selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: PermFormValues) => {
      if (sheet.mode === "create") {
        if (
          !guardPerm(PERM_ACTION_PERMS.create, {
            source: "perms.create.submit",
          })
        ) {
          return
        }

        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.perm) {
        return
      }

      if (
        !guardPerm(PERM_ACTION_PERMS.update, {
          source: "perms.update.submit",
        })
      ) {
        return
      }

      await updateMutation.mutateAsync({
        perm: sheet.perm,
        values,
      })
    },
    [createMutation, guardPerm, sheet.perm, sheet.mode, updateMutation]
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

  const removePerm = useCallback(
    (perm: PermData) => {
      const deletePermCode = getDeletePermCode(perm)
      if (!guardPerm(deletePermCode, { source: "perms.remove.confirm" })) {
        return
      }

      const treeNode = findPermNode(tree, perm.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0

      dialog.show({
        variant: "destructive",
        title: t("perms.dialog.deleteTitle"),
        description: hasChildren
          ? t("perms.dialog.deleteBranchDescription", { name: perm.name })
          : t("perms.dialog.deleteLeafDescription", { name: perm.name }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(perm)
        },
      })
    },
    [deleteMutation, dialog, getDeletePermCode, guardPerm, t, tree]
  )

  const canDeletePerm = useCallback(
    (perm: PermData) => hasPerm(getDeletePermCode(perm)),
    [getDeletePermCode, hasPerm]
  )

  const permissions = useMemo(
    () => ({
      canCreateRoot: hasPerm(PERM_ACTION_PERMS.create),
      canAddChild: hasPerm(PERM_ACTION_PERMS.create),
      canEdit: hasPerm(PERM_ACTION_PERMS.update),
      canDeleteLeaf: hasPerm(PERM_ACTION_PERMS.remove),
      canDeleteBranch: hasPerm(PERM_ACTION_PERMS.removeCascade),
      canDelete: canDeletePerm,
      hasAnyNodeAction:
        hasPerm(PERM_ACTION_PERMS.create) ||
        hasPerm(PERM_ACTION_PERMS.update) ||
        hasPerm(PERM_ACTION_PERMS.remove) ||
        hasPerm(PERM_ACTION_PERMS.removeCascade),
    }),
    [canDeletePerm, hasPerm]
  )

  return {
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
      onDelete: removePerm,
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
