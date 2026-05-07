"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildCreateTenantParam,
  buildTenantBreadcrumb,
  buildUpdateTenantParam,
  findTenantNode,
} from "@/components/base/tenants/helpers"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { tenantApi } from "@/stores/base-api"
import type {
  TenantData,
  TenantFormValues,
  TenantMutateMode,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
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

const EMPTY_TENANTS: TenantData[] = []
const DEFAULT_SHEET_STATE: TenantSheetState = {
  mode: "create",
  open: false,
  tenant: null,
  parent: null,
}

export function useTenantsController() {
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
  const [sheet, setSheet] = useState<TenantSheetState>(DEFAULT_SHEET_STATE)

  const treeQuery = useQuery({
    queryKey: ["base", "tenants", "tree", treeSearch.trim()],
    queryFn: () =>
      tenantApi.tree({
        keyword: treeSearch.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const tree = useMemo(
    () => treeQuery.data?.items ?? [],
    [treeQuery.data?.items]
  )
  const selectedNode = useMemo(
    () => (rawSelectedNodeId ? findTenantNode(tree, rawSelectedNodeId) : null),
    [rawSelectedNodeId, tree]
  )
  const selectedNodeId = selectedNode?.id ?? null
  const breadcrumb = useMemo(
    () =>
      selectedNodeId ? (buildTenantBreadcrumb(tree, selectedNodeId) ?? []) : [],
    [selectedNodeId, tree]
  )

  const childrenQuery = useQuery({
    queryKey: ["base", "tenants", "children", selectedNodeId],
    queryFn: () =>
      tenantApi.children({
        parent_id: selectedNodeId,
      }),
    enabled: selectedNodeId !== null,
    placeholderData: keepPreviousData,
  })

  const children = useMemo(
    () => childrenQuery.data?.items ?? EMPTY_TENANTS,
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
    mutationFn: async (values: TenantFormValues) => {
      await tenantApi.create(buildCreateTenantParam(values, t))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "tenants"] })
      if (sheet.parent) {
        setRawSelectedNodeId(sheet.parent.id)
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
      await queryClient.invalidateQueries({ queryKey: ["base", "tenants"] })
      toast.success(t("tenants.toast.updated"))
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (tenant: TenantData) => {
      const treeNode = findTenantNode(tree, tenant.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0
      if (hasChildren) {
        await tenantApi.removeCascade(tenant.id)
      } else {
        await tenantApi.remove([tenant.id])
      }
    },
    onSuccess: async (_, tenant) => {
      await queryClient.invalidateQueries({ queryKey: ["base", "tenants"] })
      if (selectedNodeId === tenant.id) {
        setRawSelectedNodeId(tenant.parent_id)
      }
      toast.success(t("tenants.toast.deleted"))
    },
  })

  const openCreateRoot = useCallback(() => {
    setSheet({
      mode: "create",
      open: true,
      tenant: null,
      parent: null,
    })
  }, [])

  const openAddChild = useCallback(
    (parentId: string) => {
      const parentNode =
        findTenantNode(tree, parentId) ??
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
        tenant: null,
        parent: parentNode,
      })
    },
    [selectedNode, tree]
  )

  const openEdit = useCallback(
    (tenant: TenantData) => {
      setSheet({
        mode: "update",
        open: true,
        tenant,
        parent:
          (tenant.parent_id ? findTenantNode(tree, tenant.parent_id) : null) ??
          (selectedNode?.id === tenant.parent_id ? selectedNode : null),
      })
    },
    [selectedNode, tree]
  )

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: TenantFormValues) => {
      if (sheet.mode === "create") {
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.tenant) {
        return
      }

      await updateMutation.mutateAsync({
        tenant: sheet.tenant,
        values,
      })
    },
    [createMutation, sheet.mode, sheet.tenant, updateMutation]
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

  const removeTenant = useCallback(
    (tenant: TenantData) => {
      const treeNode = findTenantNode(tree, tenant.id)
      const hasChildren = (treeNode?.children.length ?? 0) > 0

      dialog.show({
        variant: "destructive",
        title: t("tenants.dialog.deleteTitle"),
        description: hasChildren
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
