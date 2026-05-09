"use client"

import { useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { memberApi } from "@/stores/web-api"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"

const DEFAULT_PAGE_SIZE = 20

export function useMembersController() {
  const [keyword, setKeyword] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const membersQuery = useQuery({
    queryKey: [
      "web",
      "members",
      debouncedKeyword,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      memberApi.page({
        keyword: debouncedKeyword.trim() || undefined,
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      }),
    placeholderData: keepPreviousData,
  })

  return {
    members: membersQuery.data?.items ?? [],
    total: membersQuery.data?.total ?? 0,
    isFetching: membersQuery.isFetching,
    keyword,
    setKeyword,
    pagination,
    onPaginationChange: setPagination,
  }
}
