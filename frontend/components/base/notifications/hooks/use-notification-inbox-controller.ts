"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { notificationInboxApi } from "@/stores/base-api"
import type { UserNotificationData } from "@/types/base.types"

const PAGE_SIZE = 20

export function useNotificationInboxController() {
  const queryClient = useQueryClient()
  const [archived, setArchived] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const offset = (page - 1) * PAGE_SIZE

  const unreadCountQuery = useQuery({
    queryKey: ["shared", "notifications", "unread-count"],
    queryFn: () => notificationInboxApi.unreadCount(),
  })

  const notificationsQuery = useQuery({
    queryKey: [
      "shared",
      "notifications",
      "page",
      { archived, unread_only: unreadOnly, limit: PAGE_SIZE, offset },
    ],
    queryFn: () =>
      notificationInboxApi.page({
        archived,
        unread_only: unreadOnly,
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
  })

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["shared", "notifications", "unread-count"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["shared", "notifications", "page"],
      }),
    ])
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationInboxApi.markRead({ ids: [id] }),
    onSuccess: refreshQueries,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationInboxApi.markAllRead({}),
    onSuccess: refreshQueries,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationInboxApi.archive({ ids: [id] }),
    onSuccess: refreshQueries,
  })

  const total = notificationsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const items = useMemo<UserNotificationData[]>(
    () => notificationsQuery.data?.items ?? [],
    [notificationsQuery.data?.items]
  )

  return {
    items,
    total,
    totalPages,
    page,
    unreadCount: unreadCountQuery.data?.count ?? 0,
    archived,
    unreadOnly,
    isFetching:
      unreadCountQuery.isFetching ||
      notificationsQuery.isFetching ||
      markReadMutation.isPending ||
      markAllReadMutation.isPending ||
      archiveMutation.isPending,
    setArchived: (nextArchived: boolean) => {
      setArchived(nextArchived)
      setPage(1)
      if (nextArchived) {
        setUnreadOnly(false)
      }
    },
    setUnreadOnly: (nextUnreadOnly: boolean) => {
      setUnreadOnly(nextUnreadOnly)
      setPage(1)
      if (nextUnreadOnly) {
        setArchived(false)
      }
    },
    setPage,
    onRefresh: () => {
      void Promise.all([unreadCountQuery.refetch(), notificationsQuery.refetch()])
    },
    onMarkRead: async (id: string) => {
      await markReadMutation.mutateAsync(id)
      if (unreadOnly && items.length === 1 && page > 1) {
        setPage(page - 1)
      }
    },
    onMarkAllRead: async () => {
      await markAllReadMutation.mutateAsync()
      if (unreadOnly && page > 1) {
        setPage(1)
      }
    },
    onArchive: async (id: string) => {
      await archiveMutation.mutateAsync(id)
      if (!archived && items.length === 1 && page > 1) {
        setPage(page - 1)
      }
    },
  }
}
