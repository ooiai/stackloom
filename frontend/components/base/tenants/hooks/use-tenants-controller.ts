"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  TENANT_ACTION_PERMS,
  buildCreateTenantParam,
  buildTenantPathLabel,
  buildUpdateTenantParam,
} from "@/components/base/tenants/helpers"
import type { TenantTreeNode } from "@/components/base/tenants/helpers"
import { invalidateHeaderSharedQueries } from "@/hooks/use-header-context"
import { usePermissionAccess } from "@/hooks/use-permission-access"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { tenantApi } from "@/stores/base-api"
import type {
  PaginateTenant,
  TenantData,
  TenantFormValues,
  TenantMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

interface TenantSheetState {
  mode: TenantMutateMode
  open: boolean
  tenant: TenantData | null
  parent: TenantData | null
}

interface LoadedSiblingState {
  items: TenantData[]
  total: number
  pageIndex: number
  totalPages: number
  isFetching: boolean
}

const EMPTY_TENANTS: TenantData[] = []
const EMPTY_TREE: TenantTreeNode[] = []
const DEFAULT_SHEET_STATE: TenantSheetState = {
  mode: "create",
  open: false,
  tenant: null,
  parent: null,
}
const ROOT_PAGE_SIZE = 10
const CHILD_PAGE_SIZE = 20
const SEARCH_PAGE_SIZE = 10

function buildLoadedTree(
  items: TenantData[],
  expandedIds: Set<string>,
  childStateByParent: Map<string, LoadedSiblingState>
): TenantTreeNode[] {
  return items.map((item) => ({
    ...item,
    children: expandedIds.has(item.id)
      ? buildLoadedTree(
          childStateByParent.get(item.id)?.items ?? EMPTY_TENANTS,
          expandedIds,
          childStateByParent
        )
      : [],
  }))
}

function collectKnownTenants(
  map: Map<string, TenantData>,
  items: TenantData[] | undefined
) {
  for (const item of items ?? EMPTY_TENANTS) {
    map.set(item.id, item)
  }
}

export function useTenantsController() {
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
  const [rootPageIndex, setRootPageIndex] = useState(0)
  const [searchPageIndex, setSearchPageIndex] = useState(0)
  const [childPageIndexByParent, setChildPageIndexByParent] = useState<
    Record<string, number>
  >({})
  const [sheet, setSheet] = useState<TenantSheetState>(DEFAULT_SHEET_STATE)

  const selectedNodeId = rawSelectedNodeId
  const searchKeyword = treeSearch.trim()
  const isSearchMode = searchKeyword.length > 0
  const expandedIds = useMemo(
    () => new Set(manualExpandedIds),
    [manualExpandedIds]
  )

  const rootQuery = useQuery({
    queryKey: ["base", "tenants", "children", null, rootPageIndex, ROOT_PAGE_SIZE],
    queryFn: () =>
      tenantApi.children({
        parent_id: null,
        limit: ROOT_PAGE_SIZE,
        offset: rootPageIndex * ROOT_PAGE_SIZE,
      }),
    enabled: !isSearchMode,
    placeholderData: keepPreviousData,
  })

  const searchQuery = useQuery<PaginateTenant>({
    queryKey: ["base", "tenants", "page", searchKeyword, searchPageIndex, SEARCH_PAGE_SIZE],
    queryFn: () =>
      tenantApi.page({
        keyword: searchKeyword,
        limit: SEARCH_PAGE_SIZE,
        offset: searchPageIndex * SEARCH_PAGE_SIZE,
      }),
    enabled: isSearchMode,
    placeholderData: keepPreviousData,
  })

  const selectedNodeQuery = useQuery({
    queryKey: ["base", "tenants", "get", selectedNodeId],
    queryFn: () => tenantApi.get({ id: selectedNodeId! }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const breadcrumbQuery = useQuery({
    queryKey: ["base", "tenants", "ancestors", selectedNodeId],
    queryFn: () => tenantApi.ancestors({ id: selectedNodeId! }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const detailChildrenQuery = useQuery({
    queryKey: ["base", "tenants", "children", selectedNodeId, "detail"],
    queryFn: () =>
      tenantApi.children({
        parent_id: selectedNodeId,
      }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const expandedParentIds = useMemo(
    () => (isSearchMode ? [] : Array.from(expandedIds).sort()),
    [expandedIds, isSearchMode]
  )

  const expandedChildQueries = useQueries({
    queries: expandedParentIds.map((parentId) => {
      const pageIndex = childPageIndexByParent[parentId] ?? 0
      return {
        queryKey: [
          "base",
          "tenants",
          "children",
          parentId,
          pageIndex,
          CHILD_PAGE_SIZE,
          "tree",
        ],
        queryFn: () =>
          tenantApi.children({
            parent_id: parentId,
            limit: CHILD_PAGE_SIZE,
            offset: pageIndex * CHILD_PAGE_SIZE,
          }),
        placeholderData: keepPreviousData,
      }
    }),
  })

  const searchPathQueries = useQueries({
    queries: (searchQuery.data?.items ?? EMPTY_TENANTS).map((tenant) => ({
      queryKey: ["base", "tenants", "ancestors", tenant.id, "search"],
      queryFn: () => tenantApi.ancestors({ id: tenant.id }),
      enabled: isSearchMode,
      staleTime: 60_000,
    })),
  })

  const childStateByParent = useMemo(() => {
    const map = new Map<string, LoadedSiblingState>()

    expandedParentIds.forEach((parentId, index) => {
      const result = expandedChildQueries[index]
      const total = result.data?.total ?? 0
      const pageIndex = childPageIndexByParent[parentId] ?? 0
      map.set(parentId, {
        items: result.data?.items ?? EMPTY_TENANTS,
        total,
        pageIndex,
        totalPages: Math.max(1, Math.ceil(total / CHILD_PAGE_SIZE)),
        isFetching: result.isFetching,
      })
    })

    return map
  }, [childPageIndexByParent, expandedChildQueries, expandedParentIds])

  const rootItems = useMemo(
    () => rootQuery.data?.items ?? EMPTY_TENANTS,
    [rootQuery.data?.items]
  )
  const tree = useMemo(
    () =>
      isSearchMode
        ? EMPTY_TREE
        : buildLoadedTree(rootItems, expandedIds, childStateByParent),
    [childStateByParent, expandedIds, isSearchMode, rootItems]
  )

  const searchResults = useMemo(
    () => searchQuery.data?.items ?? EMPTY_TENANTS,
    [searchQuery.data?.items]
  )

  const searchPathById = useMemo(() => {
    const map = new Map<string, string>()

    searchResults.forEach((tenant, index) => {
      const items = searchPathQueries[index]?.data?.items
      if (items && items.length > 0) {
        map.set(tenant.id, buildTenantPathLabel(items))
      }
    })

    return map
  }, [searchPathQueries, searchResults])

  const selectedNode = selectedNodeQuery.data ?? null
  const breadcrumb = useMemo(
    () => breadcrumbQuery.data?.items ?? (selectedNode ? [selectedNode] : []),
    [breadcrumbQuery.data?.items, selectedNode]
  )
  const children = useMemo(
    () => detailChildrenQuery.data?.items ?? EMPTY_TENANTS,
    [detailChildrenQuery.data?.items]
  )

  const knownTenantsById = useMemo(() => {
    const map = new Map<string, TenantData>()
    collectKnownTenants(map, rootItems)
    collectKnownTenants(map, searchResults)
    collectKnownTenants(map, children)
    collectKnownTenants(map, breadcrumb)

    for (const state of childStateByParent.values()) {
      collectKnownTenants(map, state.items)
    }

    if (selectedNode) {
      map.set(selectedNode.id, selectedNode)
    }

    return map
  }, [breadcrumb, childStateByParent, children, rootItems, searchResults, selectedNode])

  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedNodeId) {
      params.set("node", selectedNodeId)
    }

    if (searchKeyword) {
      params.set("tree", searchKeyword)
    }

    const queryString = params.toString()
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchKeyword, selectedNodeId])

  const invalidateTenantQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["base", "tenants"] })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: async (values: TenantFormValues) => {
      await tenantApi.create(buildCreateTenantParam(values, t))
    },
    onSuccess: async () => {
      await invalidateTenantQueries()
      setRootPageIndex(0)
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
        setManualExpandedIds((prev) => {
          const next = new Set(prev)
          next.add(sheet.parent!.id)
          return next
        })
      }
      toast.success(t("tenants.toast.created"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      tenant,
      values,
    }: {
      tenant: TenantData
      values: TenantFormValues
    }) => {
      await tenantApi.update(buildUpdateTenantParam(tenant.id, values, t))
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateTenantQueries(),
        invalidateHeaderSharedQueries(queryClient),
      ])
      setRootPageIndex(0)
      toast.success(t("tenants.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (tenant: TenantData) => {
      if (tenant.has_children) {
        await tenantApi.removeCascade(tenant.id)
      } else {
        await tenantApi.remove([tenant.id])
      }
    },
    onSuccess: async (_, tenant) => {
      await invalidateTenantQueries()
      setRootPageIndex(0)
      if (selectedNodeId === tenant.id) {
        setRawSelectedNodeId(tenant.parent_id)
      }
      toast.success(t("tenants.toast.deleted"))
    },
  })

  const canDeleteTenant = useCallback(
    (tenant: TenantData) =>
      tenant.has_children
        ? hasPerm(TENANT_ACTION_PERMS.removeCascade)
        : hasPerm(TENANT_ACTION_PERMS.remove),
    [hasPerm]
  )

  const permissions = useMemo(
    () => ({
      canCreateRoot: hasPerm(TENANT_ACTION_PERMS.create),
      canAddChild: hasPerm(TENANT_ACTION_PERMS.create),
      canEdit: hasPerm(TENANT_ACTION_PERMS.update),
      canDelete: canDeleteTenant,
      hasAnyNodeAction:
        hasPerm(TENANT_ACTION_PERMS.create) ||
        hasPerm(TENANT_ACTION_PERMS.update) ||
        hasPerm(TENANT_ACTION_PERMS.remove) ||
        hasPerm(TENANT_ACTION_PERMS.removeCascade),
    }),
    [canDeleteTenant, hasPerm]
  )

  const resolveTenant = useCallback(
    (id: string) => knownTenantsById.get(id) ?? null,
    [knownTenantsById]
  )

  const openCreateRoot = useCallback(() => {
    if (
      !guardPerm(TENANT_ACTION_PERMS.create, {
        source: "tenants.createRoot.open",
      })
    ) {
      return
    }

    setSheet({
      mode: "create",
      open: true,
      tenant: null,
      parent: null,
    })
  }, [guardPerm])

  const openAddChild = useCallback(
    (parentId: string) => {
      if (
        !guardPerm(TENANT_ACTION_PERMS.create, {
          source: "tenants.addChild.open",
        })
      ) {
        return
      }

      const parent = resolveTenant(parentId)
      if (!parent) {
        return
      }

      setManualExpandedIds((prev) => {
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
      setChildPageIndexByParent((prev) =>
        prev[parentId] !== undefined ? prev : { ...prev, [parentId]: 0 }
      )
      setRawSelectedNodeId(parentId)
      setSheet({
        mode: "create",
        open: true,
        tenant: null,
        parent,
      })
    },
    [guardPerm, resolveTenant]
  )

  const openEdit = useCallback(
    (tenant: TenantData) => {
      if (
        !guardPerm(TENANT_ACTION_PERMS.update, {
          source: "tenants.update.open",
        })
      ) {
        return
      }

      setSheet({
        mode: "update",
        open: true,
        tenant,
        parent: tenant.parent_id ? resolveTenant(tenant.parent_id) : null,
      })
    },
    [guardPerm, resolveTenant]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: TenantFormValues) => {
      if (sheet.mode === "create") {
        if (
          !guardPerm(TENANT_ACTION_PERMS.create, {
            source: "tenants.create.submit",
          })
        ) {
          return
        }

        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.tenant) {
        return
      }

      if (
        !guardPerm(TENANT_ACTION_PERMS.update, {
          source: "tenants.update.submit",
        })
      ) {
        return
      }

      await updateMutation.mutateAsync({
        tenant: sheet.tenant,
        values,
      })
    },
    [createMutation, guardPerm, sheet.mode, sheet.tenant, updateMutation]
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
    setChildPageIndexByParent((prev) =>
      prev[id] !== undefined ? prev : { ...prev, [id]: 0 }
    )
  }, [])

  const removeTenant = useCallback(
    (tenant: TenantData) => {
      const deletePermCode = tenant.has_children
        ? TENANT_ACTION_PERMS.removeCascade
        : TENANT_ACTION_PERMS.remove

      if (!guardPerm(deletePermCode, { source: "tenants.remove.confirm" })) {
        return
      }

      dialog.show({
        variant: "destructive",
        title: t("tenants.dialog.deleteTitle"),
        description: tenant.has_children
          ? t("tenants.dialog.deleteBranchDescription", { name: tenant.name })
          : t("tenants.dialog.deleteLeafDescription", { name: tenant.name }),
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await deleteMutation.mutateAsync(tenant)
        },
      })
    },
    [deleteMutation, dialog, guardPerm, t]
  )

  const handleRootPageChange = useCallback((pageIndex: number) => {
    setRootPageIndex(pageIndex)
    setManualExpandedIds(new Set())
    setChildPageIndexByParent({})
  }, [])

  const handleChildPageChange = useCallback((parentId: string, pageIndex: number) => {
    setManualExpandedIds((prev) => {
      const next = new Set(prev)
      next.add(parentId)
      return next
    })
    setChildPageIndexByParent((prev) => ({ ...prev, [parentId]: pageIndex }))
  }, [])

  const totalRootPages = Math.max(
    1,
    Math.ceil((rootQuery.data?.total ?? 0) / ROOT_PAGE_SIZE)
  )
  const totalSearchPages = Math.max(
    1,
    Math.ceil((searchQuery.data?.total ?? 0) / SEARCH_PAGE_SIZE)
  )

  const handleSelectNode = useCallback((id: string | null) => {
    setRawSelectedNodeId(id)
  }, [])

  return {
    view: {
      permissions,
      treeSearch,
      tree,
      searchResults,
      searchResultPaths: searchPathById,
      selectedNodeId,
      selectedNode,
      breadcrumb,
      children,
      expandedIds,
      childStateByParent,
      isSearchMode,
      isFetching:
        rootQuery.isFetching ||
        searchQuery.isFetching ||
        selectedNodeQuery.isFetching ||
        breadcrumbQuery.isFetching ||
        detailChildrenQuery.isFetching ||
        expandedChildQueries.some((query) => query.isFetching),
      isInitialLoading: isSearchMode ? searchQuery.isLoading : rootQuery.isLoading,
      rootPageIndex,
      totalRootPages,
      searchPageIndex,
      totalSearchPages,
      onTreeSearchChange: (value: string) => {
        setTreeSearch(value)
        setSearchPageIndex(0)
        if (value.trim()) {
          setManualExpandedIds(new Set())
          setChildPageIndexByParent({})
        }
      },
      onToggleExpand: toggleExpand,
      onSelectNode: handleSelectNode,
      onRootPageChange: handleRootPageChange,
      onSearchPageChange: setSearchPageIndex,
      onChildPageChange: handleChildPageChange,
      onRefresh: () => {
        void invalidateTenantQueries()
      },
      onOpenCreateRoot: openCreateRoot,
      onOpenAddChild: openAddChild,
      onOpenEdit: openEdit,
      onDelete: removeTenant,
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
