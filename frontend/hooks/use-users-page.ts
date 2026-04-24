"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { createFilter, type Filter } from "@/components/reui/filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { buildCreateUserParam, buildUpdateUserParam } from "@/lib/users"
import { useAlertDialog } from "@/providers/dialog-providers"
import { userApi } from "@/stores/base-api"
import type {
  PageUserParam,
  UserData,
  UserFormValues,
  UserMutateMode,
  UserStatus,
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

interface UsersSheetState {
  mode: UserMutateMode
  open: boolean
  user: UserData | null
}

type UsersFilterValue = string | number

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SHEET_STATE: UsersSheetState = {
  mode: "create",
  open: false,
  user: null,
}

function parsePageNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.floor(parsed)
}

function parsePageSize(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    return fallback
  }

  return Math.floor(parsed)
}

function parseStatus(value: string | null): UserStatus | undefined {
  if (value == null || value === "") {
    return undefined
  }

  const parsed = Number(value)
  if (![0, 1, 2].includes(parsed)) {
    return undefined
  }

  return parsed as UserStatus
}

function createFiltersFromSearchParams(
  searchParams: { get: (key: string) => string | null }
) {
  const filters: Filter<UsersFilterValue>[] = []
  const keyword = searchParams.get("keyword")?.trim()
  const status = parseStatus(searchParams.get("status"))

  if (keyword) {
    filters.push(createFilter("keyword", "contains", [keyword]))
  }

  if (typeof status === "number") {
    filters.push(createFilter("status", "is", [status]))
  }

  return filters
}

function getKeywordFilterValue(filters: Filter<UsersFilterValue>[]) {
  const keywordFilter = filters.find((filter) => filter.field === "keyword")
  const candidate = keywordFilter?.values[0]

  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined
}

function getStatusFilterValue(filters: Filter<UsersFilterValue>[]) {
  const statusFilter = filters.find((filter) => filter.field === "status")
  const candidate = statusFilter?.values[0]

  if (typeof candidate === "number" && [0, 1, 2].includes(candidate)) {
    return candidate as UserStatus
  }

  return undefined
}

export function useUsersPage() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<Filter<UsersFilterValue>[]>(() =>
    createFiltersFromSearchParams(searchParams)
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))
  const [sheet, setSheet] = useState<UsersSheetState>(DEFAULT_SHEET_STATE)

  const debouncedFilters = useDebouncedValue(filters, 300)

  const pageParams = useMemo<PageUserParam>(
    () => ({
      keyword: getKeywordFilterValue(debouncedFilters),
      status: getStatusFilterValue(debouncedFilters),
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedFilters, pagination.pageIndex, pagination.pageSize]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    const keyword = getKeywordFilterValue(filters)
    const status = getStatusFilterValue(filters)

    if (keyword) {
      params.set("keyword", keyword)
    }

    if (typeof status === "number") {
      params.set("status", String(status))
    }

    if (pagination.pageIndex > 0) {
      params.set("page", String(pagination.pageIndex + 1))
    }

    if (pagination.pageSize !== DEFAULT_PAGE_SIZE) {
      params.set("size", String(pagination.pageSize))
    }

    const queryString = params.toString()
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(nextUrl, { scroll: false })
  }, [filters, pagination.pageIndex, pagination.pageSize, pathname, router])

  const usersQuery = useQuery({
    queryKey: ["base", "users", pageParams],
    queryFn: () => userApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      return userApi.create(await buildCreateUserParam(values))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "users"] })
      toast.success("用户已创建")
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: UserFormValues
    }) => {
      return userApi.update(buildUpdateUserParam(id, values))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "users"] })
      toast.success("用户资料已更新")
      setSheet(DEFAULT_SHEET_STATE)
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (ids: string[]) => userApi.remove(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["base", "users"] })
      toast.success("用户已删除")
    },
  })

  const handleFiltersChange = useCallback(
    (nextFilters: Filter<UsersFilterValue>[]) => {
      setFilters(nextFilters)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const openCreate = useCallback(() => {
    setSheet({
      mode: "create",
      open: true,
      user: null,
    })
  }, [])

  const openEdit = useCallback((user: UserData) => {
    setSheet({
      mode: "update",
      open: true,
      user,
    })
  }, [])

  const closeSheet = useCallback(() => {
    setSheet(DEFAULT_SHEET_STATE)
  }, [])

  const submitSheet = useCallback(
    async (values: UserFormValues) => {
      if (sheet.mode === "create") {
        await createMutation.mutateAsync(values)
        return
      }

      if (!sheet.user) {
        return
      }

      await updateMutation.mutateAsync({
        id: sheet.user.id,
        values,
      })
    },
    [createMutation, sheet.mode, sheet.user, updateMutation]
  )

  const confirmRemoveUser = useCallback(
    (user: UserData) => {
      dialog.show({
        title: "删除用户",
        description: `确定删除用户“${user.username}”吗？此操作无法撤销。`,
        confirmText: "删除",
        cancelText: "取消",
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          await removeMutation.mutateAsync([user.id])
        },
      })
    },
    [dialog, removeMutation]
  )

  return {
    filters,
    users: usersQuery.data?.items ?? [],
    total: usersQuery.data?.total ?? 0,
    isFetching: usersQuery.isFetching,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    pagination,
    sheet,
    setPagination,
    openCreate,
    openEdit,
    closeSheet,
    submitSheet,
    clearFilters,
    confirmRemoveUser,
    handleFiltersChange,
    refetchUsers: usersQuery.refetch,
  }
}
