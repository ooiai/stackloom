"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateMenuParam,
  buildMenuBreadcrumb,
  buildUpdateMenuParam,
  findMenuNode,
} from "@/components/base/menus/helpers"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { menuApi } from "@/stores/base-api"
import type {
  MenuData,
  MenuFormValues,
  MenuMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface MenuSheetState {
  mode: MenuMutateMode
  open: boolean
  menu: MenuData | null
  parent: MenuData | null
}

const EMPTY_MENUS: MenuData[] = []
const DEFAULT_SHEET_STATE: MenuSheetState = {
  mode: "create",
  open: false,
  menu: null,
  parent: null,
}

export function useMenusController() {
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
  const [sheet, setSheet] = useState<MenuSheetState>(DEFAULT_SHEET_STATE)

  const treeQuery = useQuery({
    queryKey: ["base", "menus", "tree", treeSearch.trim()],
    queryFn: () =>
      menuApi.tree({
        keyword: treeSearch.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(
    () => treeQuery.data?.items ?? [],
    [treeQuery.data?.items]
  )
  const selectedNode = useMemo(
    () => (rawSelectedNodeId ? findMenuNode(tree, rawSelectedNodeId) : null),
    [rawSelectedNodeId, tree]
  )
  const selectedNodeId = selectedNode?.id ?? null
  const breadcrumb = useMemo(
    () =>
      selectedNodeId ? (buildMenuBreadcrumb(tree, selectedNodeId) ?? []) : [],
    [selectedNodeId, tree]
  )

  const childrenQuery = useQuery({
    queryKey: ["base", "menus", "children", selectedNodeId],
    queryFn: () =>
      menuApi.children({
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
    mutationFn: async (values: MenuFormValues) => {
      await menuApi.create(buildCreateMenuParam(values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "menus"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
      }
      toast.success(t("menus.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      menu,
      values,
    }: {
      menu: MenuData
      values: MenuFormValues
    }) => {
      await menuApi.update(buildUpdateMenuParam(menu.id, values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "menus"] })
      toast.success(t("menus.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (menu: MenuData) => {
      const treeNode = findMenuNode(tree, menu.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      if (hasChildren) {
        await menuApi.removeCascade(menu.id)
      } else {
        await menuApi.remove([menu.id])
      }
    },
    onSuccess: async (_, menu) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "menus"] })
      if (selectedNodeId === menu.id) {
        setRawSelectedNodeId(menu.parent_id)
      }
      toast.success(t("menus.toast.deleted"))
    },
  })

  const openCreateRoot = useCallback(() => {
    setSheet({
      mode: "create",
      open: true,
      menu: null,
      parent: null,
    })
  }, [])

  const openAddChild = useCallback(
    (parentId: string) => {
      const parentNode =
        findMenuNode(tree, parentId) ??
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
        menu: null,
        parent: parentNode,
      })
    },
    [selectedNode, tree]
  )

  const openEdit = useCallback(
    (menu: MenuData) => {
      setSheet({
        mode: "update",
        open: true,
        menu,
        parent:
          (menu.parent_id ? findMenuNode(tree, menu.parent_id) : null) ??
          (selectedNode?.id === menu.parent_id ? selectedNode : null),
      })
    },
    [selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: MenuFormValues) => {
      if (sheet.mode === "create") {
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.menu) {
        return
      }

      await updateMutation.mutateAsync({
        menu: sheet.menu,
        values,
      })
    },
    [createMutation, sheet.menu, sheet.mode, updateMutation]
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

  const removeMenu = useCallback(
    (menu: MenuData) => {
      const treeNode = findMenuNode(tree, menu.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0

      dialog.show({
        variant: "destructive",
        title: t("menus.dialog.deleteTitle"),
        description: hasChildren
          ? t("menus.dialog.deleteBranchDescription", { name: menu.name })
          : t("menus.dialog.deleteLeafDescription", { name: menu.name }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(menu)
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
      onDelete: removeMenu,
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
