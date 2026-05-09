"use client"

import { useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useHeaderContext } from "@/hooks/use-header-context"
import { memberApi } from "@/stores/web-api"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"

const DEFAULT_PAGE_SIZE = 20

export function useMembersController() {
  const [keyword, setKeyword] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const { user } = useHeaderContext()
  const queryClient = useQueryClient()
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const QUERY_KEY = ["web", "members", debouncedKeyword, pagination.pageIndex, pagination.pageSize]

  const membersQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      memberApi.page({
        keyword: debouncedKeyword.trim() || undefined,
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      }),
    placeholderData: keepPreviousData,
  })

  const members = membersQuery.data?.items ?? []

  // Find the current user's membership record to determine admin status.
  const currentMember = user ? members.find((m) => m.user_id === user.id) : undefined
  const isAdmin = currentMember?.is_tenant_admin ?? false

  const updateStatusMutation = useMutation({
    mutationFn: memberApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["web", "members"] })
    },
  })

  return {
    members,
    total: membersQuery.data?.total ?? 0,
    isFetching: membersQuery.isFetching,
    keyword,
    setKeyword,
    pagination,
    onPaginationChange: setPagination,
    currentMember,
    isAdmin,
    updateStatusMutation,
  }
}
