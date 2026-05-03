"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { type Filter } from "@/components/reui/filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { operationLogApi } from "@/stores/log-api"
import type {
  OperationLogData,
  PageOperationLogParam,
} from "@/types/logs.types"
import {
  DEFAULT_PAGE_SIZE,
  type LogFilterValue,
  createNumberFilterFromSearchParam,
  createStringFilterFromSearchParam,
  getNumberFilterValue,
  getStringFilterValue,
  parsePageNumber,
  parsePageSize,
} from "@/components/base/logs/helpers"
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface OperationLogDetailState {
  open: boolean
  log: OperationLogData | null
}

export type OperationLogsFilterValue = LogFilterValue

const DEFAULT_DETAIL_STATE: OperationLogDetailState = {
  open: false,
  log: null,
}

function createFiltersFromSearchParams(searchParams: {
  get: (key: string) => string | null
}) {
  return [
    createStringFilterFromSearchParam(searchParams, "keyword"),
    createStringFilterFromSearchParam(searchParams, "module"),
    createStringFilterFromSearchParam(searchParams, "biz_type"),
    createStringFilterFromSearchParam(searchParams, "operation"),
    createNumberFilterFromSearchParam(searchParams, "result"),
    createStringFilterFromSearchParam(searchParams, "trace_id", "is"),
  ].filter(Boolean) as Filter<OperationLogsFilterValue>[]
}

export function useOperationLogsController() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filter<OperationLogsFilterValue>[]>(
    () => createFiltersFromSearchParams(searchParams)
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))
  const [detail, setDetail] = useState<OperationLogDetailState>(
    DEFAULT_DETAIL_STATE
  )

  const debouncedFilters = useDebouncedValue(filters, 300)

  const pageParams = useMemo<PageOperationLogParam>(
    () => ({
      keyword: getStringFilterValue(debouncedFilters, "keyword"),
      module: getStringFilterValue(debouncedFilters, "module"),
      biz_type: getStringFilterValue(debouncedFilters, "biz_type"),
      operation: getStringFilterValue(debouncedFilters, "operation"),
      result: getNumberFilterValue(debouncedFilters, "result"),
      trace_id: getStringFilterValue(debouncedFilters, "trace_id"),
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedFilters, pagination.pageIndex, pagination.pageSize]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    const keyword = getStringFilterValue(filters, "keyword")
    const moduleName = getStringFilterValue(filters, "module")
    const bizType = getStringFilterValue(filters, "biz_type")
    const operation = getStringFilterValue(filters, "operation")
    const result = getNumberFilterValue(filters, "result")
    const traceId = getStringFilterValue(filters, "trace_id")

    if (keyword) params.set("keyword", keyword)
    if (moduleName) params.set("module", moduleName)
    if (bizType) params.set("biz_type", bizType)
    if (operation) params.set("operation", operation)
    if (typeof result === "number") params.set("result", String(result))
    if (traceId) params.set("trace_id", traceId)
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

  const logsQuery = useQuery({
    queryKey: ["logs", "operation", pageParams],
    queryFn: () => operationLogApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const handleFiltersChange = useCallback(
    (nextFilters: Filter<OperationLogsFilterValue>[]) => {
      setFilters(nextFilters)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const openDetail = useCallback((log: OperationLogData) => {
    setDetail({
      open: true,
      log,
    })
  }, [])

  const closeDetail = useCallback(() => {
    setDetail(DEFAULT_DETAIL_STATE)
  }, [])

  return {
    view: {
      filters,
      logs: logsQuery.data?.items ?? [],
      total: logsQuery.data?.total ?? 0,
      isFetching: logsQuery.isFetching,
      pagination,
      onPaginationChange: setPagination,
      onFiltersChange: handleFiltersChange,
      onClearFilters: clearFilters,
      onRefresh: () => {
        void logsQuery.refetch()
      },
      onOpenDetail: openDetail,
    },
    detail: {
      ...detail,
      onClose: closeDetail,
    },
  }
}
