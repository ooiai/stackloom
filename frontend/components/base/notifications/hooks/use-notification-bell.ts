"use client"

import { useEffect, useMemo } from "react"

import { createSSE } from "@/lib/http/axios"
import { notificationInboxApi } from "@/stores/base-api"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const INBOX_PAGE_SIZE = 8

export interface NotificationBellData {
  unreadCount: number
  notifications: Awaited<
    ReturnType<typeof notificationInboxApi.page>
  >["items"]
  isFetching: boolean
  onRefresh: () => void
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onArchive: (id: string) => Promise<void>
}

export function useNotificationBellData(): NotificationBellData {
  const queryClient = useQueryClient()

  const unreadCountQuery = useQuery({
    queryKey: ["shared", "notifications", "unread-count"],
    queryFn: () => notificationInboxApi.unreadCount(),
  })

  const inboxQuery = useQuery({
    queryKey: ["shared", "notifications", "page", { limit: INBOX_PAGE_SIZE }],
    queryFn: () =>
      notificationInboxApi.page({
        limit: INBOX_PAGE_SIZE,
        offset: 0,
        archived: false,
      }),
    placeholderData: keepPreviousData,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationInboxApi.markRead({ ids: [id] }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "unread-count"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "page"],
        }),
      ])
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationInboxApi.markAllRead({}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "unread-count"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "page"],
        }),
      ])
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationInboxApi.archive({ ids: [id] }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "unread-count"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "page"],
        }),
      ])
    },
  })

  useEffect(() => {
    const sse = createSSE("/apiv1/shared/notifications/stream", () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "unread-count"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shared", "notifications", "page"],
        }),
      ])
    })

    void sse.start()
    return () => {
      sse.close()
    }
  }, [queryClient])

  const notifications = useMemo(
    () => inboxQuery.data?.items ?? [],
    [inboxQuery.data?.items]
  )

  return {
    unreadCount: unreadCountQuery.data?.count ?? 0,
    notifications,
    isFetching:
      unreadCountQuery.isFetching ||
      inboxQuery.isFetching ||
      markReadMutation.isPending ||
      markAllReadMutation.isPending ||
      archiveMutation.isPending,
    onRefresh: () => {
      void Promise.all([unreadCountQuery.refetch(), inboxQuery.refetch()])
    },
    onMarkRead: async (id: string) => {
      await markReadMutation.mutateAsync(id)
    },
    onMarkAllRead: async () => {
      await markAllReadMutation.mutateAsync()
    },
    onArchive: async (id: string) => {
      await archiveMutation.mutateAsync(id)
    },
  }
}
