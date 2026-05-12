"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { createFilter, type Filter } from "@/components/reui/filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAlertDialog } from "@/providers/dialog-providers"
import { useI18n } from "@/providers/i18n-provider"
import { tenantApplyApi } from "@/stores/base-api"
import type {
  PageTenantApplyParam,
  TenantApplyData,
  TenantApplyMembershipStatus,
} from "@/types/base.types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export type TenantApplyFilterValue = string | number

const DEFAULT_PAGE_SIZE = 10

function parsePageNumber(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function parsePageSize(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return fallback
  return Math.floor(parsed)
}

function parseMembershipStatus(
  value: string | null
): TenantApplyMembershipStatus | undefined {
  if (value == null || value === "") return undefined
  const parsed = Number(value)
  if (![0, 1, 2].includes(parsed)) return undefined
  return parsed as TenantApplyMembershipStatus
}

function createFiltersFromSearchParams(searchParams: {
  get: (key: string) => string | null
}): Filter<TenantApplyFilterValue>[] {
  const filters: Filter<TenantApplyFilterValue>[] = []
  const keyword = searchParams.get("keyword")?.trim()
  const status = parseMembershipStatus(searchParams.get("status"))

  if (keyword) {
    filters.push(createFilter("keyword", "contains", [keyword]))
  }

  if (typeof status === "number") {
    filters.push(createFilter("status", "is", [status]))
  }

  return filters
}

function getKeywordValue(filters: Filter<TenantApplyFilterValue>[]) {
  const f = filters.find((f) => f.field === "keyword")
  const v = f?.values[0]
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

function getStatusValue(
  filters: Filter<TenantApplyFilterValue>[]
): TenantApplyMembershipStatus | undefined {
  const f = filters.find((f) => f.field === "status")
  const v = f?.values[0]
  if (typeof v === "number" && [0, 1, 2].includes(v)) {
    return v as TenantApplyMembershipStatus
  }
  return undefined
}

export function useTenantApplyController() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<Filter<TenantApplyFilterValue>[]>(() =>
    createFiltersFromSearchParams(searchParams)
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))

  const debouncedFilters = useDebouncedValue(filters, 300)

  const pageParams = useMemo<PageTenantApplyParam>(
    () => ({
      keyword: getKeywordValue(debouncedFilters),
      status: getStatusValue(debouncedFilters),
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedFilters, pagination.pageIndex, pagination.pageSize]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    const keyword = getKeywordValue(filters)
    const status = getStatusValue(filters)

    if (keyword) params.set("keyword", keyword)
    if (typeof status === "number") params.set("status", String(status))
    if (pagination.pageIndex > 0)
      params.set("page", String(pagination.pageIndex + 1))
    if (pagination.pageSize !== DEFAULT_PAGE_SIZE)
      params.set("size", String(pagination.pageSize))

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [filters, pagination.pageIndex, pagination.pageSize, pathname, router])

  const applyQuery = useQuery({
    queryKey: ["base", "applies", pageParams],
    queryFn: () => tenantApplyApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => tenantApplyApi.approve({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "applies"] })
      toast.success(t("tenant-apply.toasts.approved"))
    },
    onError: (err: { errorKey?: string }) => {
      toast.error(err?.errorKey ? t(err.errorKey) : t("common.misc.error"))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => tenantApplyApi.reject({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "applies"] })
      toast.success(t("tenant-apply.toasts.rejected"))
    },
    onError: (err: { errorKey?: string }) => {
      toast.error(err?.errorKey ? t(err.errorKey) : t("common.misc.error"))
    },
  })

  const banMutation = useMutation({
    mutationFn: (id: string) => tenantApplyApi.ban({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "applies"] })
      toast.success(t("tenant-apply.toasts.banned"))
    },
    onError: (err: { errorKey?: string }) => {
      toast.error(err?.errorKey ? t(err.errorKey) : t("common.misc.error"))
    },
  })

  const handleApprove = useCallback(
    (row: TenantApplyData) => {
      dialog.show({
        variant: "default",
        title: t("tenant-apply.dialogs.approve.title"),
        description: t("tenant-apply.dialogs.approve.description", {
          name: row.tenant_name,
        }),
        confirmText: t("tenant-apply.actions.approve"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await approveMutation.mutateAsync(row.id)
        },
      })
    },
    [dialog, t, approveMutation]
  )

  const handleReject = useCallback(
    (row: TenantApplyData) => {
      dialog.show({
        variant: "default",
        title: t("tenant-apply.dialogs.reject.title"),
        description: t("tenant-apply.dialogs.reject.description", {
          name: row.tenant_name,
        }),
        confirmText: t("tenant-apply.actions.reject"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await rejectMutation.mutateAsync(row.id)
        },
      })
    },
    [dialog, t, rejectMutation]
  )

  const handleBan = useCallback(
    (row: TenantApplyData) => {
      dialog.show({
        variant: "destructive",
        title: t("tenant-apply.dialogs.ban.title"),
        description: t("tenant-apply.dialogs.ban.description", {
          name: row.applicant_username,
        }),
        confirmText: t("tenant-apply.actions.ban"),
        cancelText: t("common.actions.cancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await banMutation.mutateAsync(row.id)
        },
      })
    },
    [dialog, t, banMutation]
  )

  const handleFiltersChange = useCallback(
    (nextFilters: Filter<TenantApplyFilterValue>[]) => {
      setFilters(nextFilters)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  return {
    view: {
      filters,
      items: applyQuery.data?.items ?? [],
      total: applyQuery.data?.total ?? 0,
      isFetching: applyQuery.isFetching,
      pagination,
      onPaginationChange: setPagination,
      onFiltersChange: handleFiltersChange,
      onClearFilters: clearFilters,
      onRefresh: () => void applyQuery.refetch(),
      onApprove: handleApprove,
      onReject: handleReject,
      onBan: handleBan,
    },
  }
}
