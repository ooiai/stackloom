"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { type Filter } from "@/components/reui/filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { systemLogApi } from "@/stores/log-api"
import type { PageSystemLogParam, SystemLogData } from "@/types/logs.types"
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

interface SystemLogDetailState {
  open: boolean
  log: SystemLogData | null
}

export type SystemLogsFilterValue = LogFilterValue

const DEFAULT_DETAIL_STATE: SystemLogDetailState = {
  open: false,
  log: null,
}

function createFiltersFromSearchParams(searchParams: {
  get: (key: string) => string | null
}) {
  return [
    createStringFilterFromSearchParam(searchParams, "trace_id", "is"),
    createStringFilterFromSearchParam(searchParams, "request_id", "is"),
    createStringFilterFromSearchParam(searchParams, "method", "is"),
    createStringFilterFromSearchParam(searchParams, "result", "is"),
    createStringFilterFromSearchParam(searchParams, "path"),
    createNumberFilterFromSearchParam(searchParams, "status_code"),
  ].filter(Boolean) as Filter<SystemLogsFilterValue>[]
}

export function useSystemLogsController() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filter<SystemLogsFilterValue>[]>(() =>
    createFiltersFromSearchParams(searchParams)
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))
  const [detail, setDetail] = useState<SystemLogDetailState>(DEFAULT_DETAIL_STATE)

  const debouncedFilters = useDebouncedValue(filters, 300)

  const pageParams = useMemo<PageSystemLogParam>(
    () => ({
      trace_id: getStringFilterValue(debouncedFilters, "trace_id"),
      request_id: getStringFilterValue(debouncedFilters, "request_id"),
      method: getStringFilterValue(debouncedFilters, "method"),
      result: getStringFilterValue(debouncedFilters, "result"),
      path: getStringFilterValue(debouncedFilters, "path"),
      status_code: getNumberFilterValue(debouncedFilters, "status_code"),
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedFilters, pagination.pageIndex, pagination.pageSize]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    const traceId = getStringFilterValue(filters, "trace_id")
    const requestId = getStringFilterValue(filters, "request_id")
    const method = getStringFilterValue(filters, "method")
    const result = getStringFilterValue(filters, "result")
    const path = getStringFilterValue(filters, "path")
    const statusCode = getNumberFilterValue(filters, "status_code")

    if (traceId) params.set("trace_id", traceId)
    if (requestId) params.set("request_id", requestId)
    if (method) params.set("method", method)
    if (result) params.set("result", result)
    if (path) params.set("path", path)
    if (typeof statusCode === "number") {
      params.set("status_code", String(statusCode))
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

  const logsQuery = useQuery({
    queryKey: ["logs", "system", pageParams],
    queryFn: () => systemLogApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const handleFiltersChange = useCallback(
    (nextFilters: Filter<SystemLogsFilterValue>[]) => {
      setFilters(nextFilters)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const openDetail = useCallback((log: SystemLogData) => {
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
