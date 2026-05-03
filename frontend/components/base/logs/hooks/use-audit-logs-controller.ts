"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { type Filter } from "@/components/reui/filters"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { auditLogApi } from "@/stores/log-api"
import type { AuditLogData, PageAuditLogParam } from "@/types/logs.types"
import {
  DEFAULT_PAGE_SIZE,
  type LogFilterValue,
  createStringFilterFromSearchParam,
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

interface AuditLogDetailState {
  open: boolean
  log: AuditLogData | null
}

export type AuditLogsFilterValue = LogFilterValue

const DEFAULT_DETAIL_STATE: AuditLogDetailState = {
  open: false,
  log: null,
}

function createFiltersFromSearchParams(searchParams: {
  get: (key: string) => string | null
}) {
  return [
    createStringFilterFromSearchParam(searchParams, "trace_id", "is"),
    createStringFilterFromSearchParam(searchParams, "target_type"),
    createStringFilterFromSearchParam(searchParams, "target_id", "is"),
    createStringFilterFromSearchParam(searchParams, "action"),
    createStringFilterFromSearchParam(searchParams, "result", "is"),
  ].filter(Boolean) as Filter<AuditLogsFilterValue>[]
}

export function useAuditLogsController() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filter<AuditLogsFilterValue>[]>(() =>
    createFiltersFromSearchParams(searchParams)
  )
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: parsePageNumber(searchParams.get("page"), 1) - 1,
    pageSize: parsePageSize(searchParams.get("size"), DEFAULT_PAGE_SIZE),
  }))
  const [detail, setDetail] = useState<AuditLogDetailState>(DEFAULT_DETAIL_STATE)

  const debouncedFilters = useDebouncedValue(filters, 300)

  const pageParams = useMemo<PageAuditLogParam>(
    () => ({
      trace_id: getStringFilterValue(debouncedFilters, "trace_id"),
      target_type: getStringFilterValue(debouncedFilters, "target_type"),
      target_id: getStringFilterValue(debouncedFilters, "target_id"),
      action: getStringFilterValue(debouncedFilters, "action"),
      result: getStringFilterValue(debouncedFilters, "result"),
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    }),
    [debouncedFilters, pagination.pageIndex, pagination.pageSize]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    const traceId = getStringFilterValue(filters, "trace_id")
    const targetType = getStringFilterValue(filters, "target_type")
    const targetId = getStringFilterValue(filters, "target_id")
    const action = getStringFilterValue(filters, "action")
    const result = getStringFilterValue(filters, "result")

    if (traceId) params.set("trace_id", traceId)
    if (targetType) params.set("target_type", targetType)
    if (targetId) params.set("target_id", targetId)
    if (action) params.set("action", action)
    if (result) params.set("result", result)
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
    queryKey: ["logs", "audit", pageParams],
    queryFn: () => auditLogApi.page(pageParams),
    placeholderData: keepPreviousData,
  })

  const handleFiltersChange = useCallback(
    (nextFilters: Filter<AuditLogsFilterValue>[]) => {
      setFilters(nextFilters)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const openDetail = useCallback((log: AuditLogData) => {
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
