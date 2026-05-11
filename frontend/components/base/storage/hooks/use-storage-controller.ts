"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { storageApi } from "@/stores/storage-api"
import type { StorageProviderData } from "@/types/storage.types"
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  DEFAULT_STORAGE_PAGE_SIZE,
  isStorageImageKey,
  type StorageRowData,
  findStorageProviderLabel,
  normalizeStoragePrefix,
  parseStoragePageSize,
  toStorageRows,
} from "../helpers"
import { useI18n } from "@/providers/i18n-provider"

interface StorageDetailState {
  open: boolean
  item: StorageRowData | null
}

interface StorageImagePreviewState {
  open: boolean
  item: StorageRowData | null
  signedUrl: string | null
}

const DEFAULT_DETAIL_STATE: StorageDetailState = {
  open: false,
  item: null,
}

const DEFAULT_IMAGE_PREVIEW_STATE: StorageImagePreviewState = {
  open: false,
  item: null,
  signedUrl: null,
}

export function useStorageController() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [provider, setProvider] = useState(searchParams.get("provider") ?? "")
  const [prefix, setPrefix] = useState(searchParams.get("prefix") ?? "")
  const [pageSize, setPageSize] = useState(() =>
    parseStoragePageSize(searchParams.get("size"), DEFAULT_STORAGE_PAGE_SIZE)
  )
  const [pageIndex, setPageIndex] = useState(0)
  const [tokens, setTokens] = useState<Array<string | null>>([null])
  const [detail, setDetail] = useState<StorageDetailState>(DEFAULT_DETAIL_STATE)
  const [imagePreview, setImagePreview] = useState<StorageImagePreviewState>(
    DEFAULT_IMAGE_PREVIEW_STATE
  )

  const debouncedPrefix = useDebouncedValue(prefix, 300)
  const normalizedPrefix = useMemo(
    () => normalizeStoragePrefix(debouncedPrefix),
    [debouncedPrefix]
  )
  const currentToken = tokens[pageIndex] ?? undefined

  const metaQuery = useQuery({
    queryKey: ["storage", "meta"],
    queryFn: () => storageApi.get(),
  })

  const providers = useMemo(() => metaQuery.data?.providers ?? [], [metaQuery.data?.providers])
  const defaultProvider = metaQuery.data?.default_provider ?? ""
  const effectiveProvider = useMemo(() => {
    const isKnown = providers.some((item) => item.code === provider)
    if (provider && isKnown) {
      return provider
    }

    return defaultProvider
  }, [defaultProvider, provider, providers])

  useEffect(() => {
    const params = new URLSearchParams()
    if (effectiveProvider) params.set("provider", effectiveProvider)
    if (prefix.trim()) params.set("prefix", prefix.trim())
    if (pageSize !== DEFAULT_STORAGE_PAGE_SIZE) {
      params.set("size", String(pageSize))
    }

    const queryString = params.toString()
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [effectiveProvider, pageSize, pathname, prefix, router])

  const pageQuery = useQuery({
    enabled: Boolean(effectiveProvider),
    queryKey: ["storage", "page", effectiveProvider, normalizedPrefix, currentToken, pageSize],
    queryFn: () =>
      storageApi.page({
        provider: effectiveProvider,
        prefix: normalizedPrefix,
        continuation_token: currentToken,
        page_size: pageSize,
      }),
    placeholderData: keepPreviousData,
  })

  const signMutation = useMutation({
    mutationFn: storageApi.sign,
  })

  const copyKeyClipboard = useCopyToClipboard({
    onCopy: () => {
      toast.success(t("storage.toast.keyCopied"))
    },
  })
  const copyUrlClipboard = useCopyToClipboard({
    onCopy: () => {
      toast.success(t("storage.toast.urlCopied"))
    },
  })

  const items = useMemo(
    () => toStorageRows(pageQuery.data?.items ?? []),
    [pageQuery.data?.items]
  )

  const resetPagination = useCallback(() => {
    setPageIndex(0)
    setTokens([null])
  }, [])

  const openDetail = useCallback((item: StorageRowData) => {
    setDetail({
      open: true,
      item,
    })
  }, [])

  const closeDetail = useCallback(() => {
    setDetail(DEFAULT_DETAIL_STATE)
  }, [])

  const closeImagePreview = useCallback(() => {
    setImagePreview(DEFAULT_IMAGE_PREVIEW_STATE)
  }, [])

  const copyKey = useCallback(
    (item: StorageRowData) => {
      copyKeyClipboard.copy(item.key)
    },
    [copyKeyClipboard]
  )

  const copyUrl = useCallback(
    (item: StorageRowData) => {
      copyUrlClipboard.copy(item.public_url)
    },
    [copyUrlClipboard]
  )

  const preview = useCallback(
    async (item: StorageRowData) => {
      try {
        const result = await signMutation.mutateAsync({
          provider: item.provider,
          bucket: item.bucket,
          key: item.key,
        })
        if (isStorageImageKey(item.key)) {
          setImagePreview({
            open: true,
            item,
            signedUrl: result.signed_url,
          })
          return
        }

        window.open(result.signed_url, "_blank", "noopener,noreferrer")
      } catch (error) {
        console.error("[storage preview]", error)
        toast.error(t("storage.toast.previewFailed"))
      }
    },
    [signMutation, t]
  )

  const prevPage = useCallback(() => {
    setPageIndex((current) => Math.max(0, current - 1))
  }, [])

  const nextPage = useCallback(() => {
    const nextToken = pageQuery.data?.next_token
    if (!nextToken) {
      return
    }

    setTokens((current) => {
      const nextTokens = current.slice(0, pageIndex + 1)
      nextTokens.push(nextToken)
      return nextTokens
    })
    setPageIndex((current) => current + 1)
  }, [pageIndex, pageQuery.data?.next_token])

  const clearFilters = useCallback(() => {
    resetPagination()
    setProvider(defaultProvider)
    setPrefix("")
    setPageSize(DEFAULT_STORAGE_PAGE_SIZE)
  }, [defaultProvider, resetPagination])

  const handleProviderChange = useCallback(
    (value: string) => {
      resetPagination()
      setProvider(value)
    },
    [resetPagination]
  )

  const handlePrefixChange = useCallback(
    (value: string) => {
      resetPagination()
      setPrefix(value)
    },
    [resetPagination]
  )

  const handlePageSizeChange = useCallback(
    (value: number) => {
      resetPagination()
      setPageSize(value)
    },
    [resetPagination]
  )

  const currentProviderLabel = useMemo(
    () => findStorageProviderLabel(providers as StorageProviderData[], effectiveProvider),
    [effectiveProvider, providers]
  )
  const currentBucket = pageQuery.data?.provider.bucket ?? ""
  const hasActiveFilters =
    prefix.trim().length > 0 ||
    pageSize !== DEFAULT_STORAGE_PAGE_SIZE ||
    (defaultProvider.length > 0 && effectiveProvider !== defaultProvider)

  return {
    view: {
      providers,
      provider: effectiveProvider,
      prefix,
      pageSize,
      currentBucket,
      hasActiveFilters,
      items,
      totalOnPage: items.length,
      pageIndex,
      isFetching: pageQuery.isFetching || signMutation.isPending,
      isMetaLoading: metaQuery.isLoading,
      hasNextPage: Boolean(pageQuery.data?.next_token),
      currentProviderLabel,
      onProviderChange: handleProviderChange,
      onPrefixChange: handlePrefixChange,
      onPageSizeChange: handlePageSizeChange,
      onClear: clearFilters,
      onRefresh: () => {
        void Promise.all([metaQuery.refetch(), pageQuery.refetch()])
      },
      onPrevPage: prevPage,
      onNextPage: nextPage,
      onOpenDetail: openDetail,
      onCopyKey: copyKey,
      onCopyUrl: copyUrl,
      onPreview: preview,
    },
    detail: {
      ...detail,
      onClose: closeDetail,
    },
    imagePreview: {
      ...imagePreview,
      onClose: closeImagePreview,
    },
  }
}
