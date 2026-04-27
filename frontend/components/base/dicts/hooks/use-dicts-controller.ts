"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateDictParam,
  buildDictBreadcrumb,
  buildUpdateDictParam,
  findDictNode,
} from "@/components/base/dicts/helpers"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { dictApi } from "@/stores/base-api"
import type {
  DictData,
  DictFormValues,
  DictMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

const EMPTY_DICTS: DictData[] = []

interface DictSheetState {
  mode: DictMutateMode
  open: boolean
  dict: DictData | null
  parent: DictData | null
}

const DEFAULT_SHEET_STATE: DictSheetState = {
  mode: "create",
  open: false,
  dict: null,
  parent: null,
}

export function useDictsController() {
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
  const [sheet, setSheet] = useState<DictSheetState>(DEFAULT_SHEET_STATE)
  const debouncedTreeSearch = useDebouncedValue(treeSearch, 200)

  const treeQuery = useQuery({
    queryKey: ["base", "dicts", "tree", debouncedTreeSearch.trim()],
    queryFn: () =>
      dictApi.tree({
        keyword: debouncedTreeSearch.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(
    () => treeQuery.data?.items ?? [],
    [treeQuery.data?.items]
  )
  const selectedNode = useMemo(
    () => (rawSelectedNodeId ? findDictNode(tree, rawSelectedNodeId) : null),
    [rawSelectedNodeId, tree]
  )
  const selectedNodeId = selectedNode?.id ?? null
  const breadcrumb = useMemo(
    () =>
      selectedNodeId ? (buildDictBreadcrumb(tree, selectedNodeId) ?? []) : [],
    [selectedNodeId, tree]
  )

  const childrenQuery = useQuery({
    queryKey: ["base", "dicts", "children", selectedNodeId],
    queryFn: () =>
      dictApi.children({
        parent_id: selectedNodeId,
      }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const children = useMemo(
    () => childrenQuery.data?.items ?? EMPTY_DICTS,
    [childrenQuery.data?.items]
  )

  const expandedIds = useMemo(
    () => new Set(manualExpandedIds),
    [manualExpandedIds]
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
    mutationFn: async (values: DictFormValues) => {
      await dictApi.create(buildCreateDictParam(values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
      }
      toast.success(t("dicts.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      dict,
      values,
    }: {
      dict: DictData
      values: DictFormValues
    }) => {
      await dictApi.update(buildUpdateDictParam(dict.id, values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })
      toast.success(t("dicts.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (dict: DictData) => {
      if (dict.is_leaf) {
        await dictApi.remove([dict.id])
      } else {
        await dictApi.removeCascade(dict.id)
      }
    },
    onSuccess: async (_, dict) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })

      if (selectedNodeId === dict.id) {
        setRawSelectedNodeId(dict.parent_id)
      }

      toast.success(t("dicts.toast.deleted"))
    },
  })

  const openCreateRoot = useCallback(() => {
    setSheet({
      mode: "create",
      open: true,
      dict: null,
      parent: null,
    })
  }, [])

  const openAddChild = useCallback(
    (parentId: string) => {
      const parentNode =
        findDictNode(tree, parentId) ??
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
        dict: null,
        parent: parentNode,
      })
    },
    [selectedNode, tree]
  )

  const openEdit = useCallback(
    (dict: DictData) => {
      setSheet({
        mode: "update",
        open: true,
        dict,
        parent:
          (dict.parent_id ? findDictNode(tree, dict.parent_id) : null) ??
          (selectedNode?.id === dict.parent_id ? selectedNode : null),
      })
    },
    [selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: DictFormValues) => {
      if (sheet.mode === "create") {
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.dict) {
        return
      }

      await updateMutation.mutateAsync({
        dict: sheet.dict,
        values,
      })
    },
    [createMutation, sheet.dict, sheet.mode, updateMutation]
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

  const selectNode = useCallback(
    (id: string | null) => {
      setRawSelectedNodeId(id)
    },
    []
  )

  const removeDict = useCallback(
    (dict: DictData) => {
      dialog.show({
        title: t("dicts.dialog.deleteTitle"),
        description: dict.is_leaf
          ? t("dicts.dialog.deleteLeafDescription", { label: dict.label })
          : t("dicts.dialog.deleteBranchDescription", { label: dict.label }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(dict)
        },
      })
    },
    [deleteMutation, dialog, t]
  )

  return {
    view: {
      treeSearch,
      tree,
      selectedNodeId,
      selectedNode,
      breadcrumb,
      children,
      expandedIds,
      isFetching: treeQuery.isFetching || childrenQuery.isFetching,
      isInitialLoading: treeQuery.isLoading,
      onTreeSearchChange: setTreeSearch,
      onToggleExpand: toggleExpand,
      onSelectNode: selectNode,
      onRefresh: () => {
        void treeQuery.refetch()
        if (selectedNodeId) {
          void childrenQuery.refetch()
        }
      },
      onOpenCreateRoot: openCreateRoot,
      onOpenAddChild: openAddChild,
      onOpenEdit: openEdit,
      onDelete: removeDict,
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
