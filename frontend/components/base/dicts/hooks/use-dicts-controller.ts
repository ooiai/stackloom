"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateDictParam,
  buildDictBreadcrumb,
  buildDictTree,
  buildUpdateDictParam,
  filterDictTree,
  findDictNode,
  getDirectDictChildren,
  getExpandedIdsForTree,
} from "@/lib/dicts"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAlertDialog } from "@/providers/dialog-providers"
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

const ALL_DICTS_LIMIT = 500
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

  const dictsQuery = useQuery({
    queryKey: ["base", "dicts", "all"],
    queryFn: () =>
      dictApi.page({
        limit: ALL_DICTS_LIMIT,
        offset: 0,
      }),
    placeholderData: keepPreviousData,
  })

  const allDicts = dictsQuery.data?.items ?? EMPTY_DICTS
  const total = dictsQuery.data?.total ?? 0

  const tree = useMemo(() => buildDictTree(allDicts), [allDicts])
  const filteredTree = useMemo(
    () => filterDictTree(tree, debouncedTreeSearch),
    [debouncedTreeSearch, tree]
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
  const children = useMemo(
    () => getDirectDictChildren(allDicts, selectedNodeId),
    [allDicts, selectedNodeId]
  )

  const expandedIds = useMemo(() => {
    const selectedPathIds = new Set(breadcrumb.map((node) => node.id))

    if (debouncedTreeSearch.trim()) {
      return getExpandedIdsForTree(filteredTree)
    }

    return new Set([...manualExpandedIds, ...selectedPathIds])
  }, [breadcrumb, debouncedTreeSearch, filteredTree, manualExpandedIds])

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
      const parent = sheet.parent

      await dictApi.create(buildCreateDictParam(values))

      if (parent?.is_leaf) {
        await dictApi.update({
          id: parent.id,
          is_leaf: false,
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
      }
      toast.success("字典项已创建")
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
      const currentNode = findDictNode(tree, dict.id)
      const params = buildUpdateDictParam(dict.id, values)
      params.is_leaf = (currentNode?.children.length ?? 0) === 0

      await dictApi.update(params)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })
      toast.success("字典项已更新")
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (dict: DictData) => {
      await dictApi.remove([dict.id])

      const parentId = dict.parent_id
      if (!parentId) {
        return
      }

      const siblings = getDirectDictChildren(allDicts, parentId)
      if (siblings.length === 1) {
        await dictApi.update({
          id: parentId,
          is_leaf: true,
        })
      }
    },
    onSuccess: async (_, dict) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "dicts"] })

      if (selectedNodeId === dict.id) {
        setRawSelectedNodeId(dict.parent_id)
      }

      toast.success("字典项已删除")
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
      const parentNode = findDictNode(tree, parentId)
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
    [tree]
  )

  const openEdit = useCallback(
    (dict: DictData) => {
      setSheet({
        mode: "update",
        open: true,
        dict,
        parent: dict.parent_id ? findDictNode(tree, dict.parent_id) : null,
      })
    },
    [tree]
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

      if (!id) {
        return
      }

      const path = buildDictBreadcrumb(tree, id)
      if (!path) {
        return
      }

      setManualExpandedIds((prev) => {
        const next = new Set(prev)
        for (const node of path) {
          next.add(node.id)
        }
        return next
      })
    },
    [tree]
  )

  const removeDict = useCallback(
    (dict: DictData) => {
      const currentNode = findDictNode(tree, dict.id)
      const childCount = currentNode?.children.length ?? 0

      if (childCount > 0) {
        toast.error(
          `“${dict.label}”下还有 ${childCount} 个子级，当前后端不支持级联删除，请先处理子级。`
        )
        return
      }

      dialog.show({
        title: "删除字典项",
        description: `确定删除“${dict.label}”吗？此操作无法撤销。`,
        confirmText: "删除",
        cancelText: "取消",
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(dict)
        },
      })
    },
    [deleteMutation, dialog, tree]
  )

  return {
    view: {
      treeSearch,
      total,
      loadedCount: allDicts.length,
      tree,
      filteredTree,
      selectedNodeId,
      selectedNode,
      breadcrumb,
      children,
      expandedIds,
      isFetching: dictsQuery.isFetching,
      isInitialLoading: dictsQuery.isLoading,
      isTreeTruncated: total > allDicts.length,
      onTreeSearchChange: setTreeSearch,
      onToggleExpand: toggleExpand,
      onSelectNode: selectNode,
      onRefresh: () => {
        void dictsQuery.refetch()
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
