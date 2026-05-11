"use client"

import { Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTER_ENUM } from "@/lib/config/enums"
import { formatDateTime } from "@/components/base/notifications/helpers"
import type { UserNotificationData } from "@/types/base.types"

interface NotificationsPageViewProps {
  items: UserNotificationData[]
  total: number
  totalPages: number
  page: number
  unreadCount: number
  archived: boolean
  unreadOnly: boolean
  isFetching: boolean
  setArchived: (value: boolean) => void
  setUnreadOnly: (value: boolean) => void
  setPage: (page: number) => void
  onRefresh: () => void
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onArchive: (id: string) => Promise<void>
}

function NotificationListItem({
  item,
  onMarkRead,
  onArchive,
}: {
  item: UserNotificationData
  onMarkRead: (id: string) => Promise<void>
  onArchive: (id: string) => Promise<void>
}) {
  const t = useTranslations("notifications")
  const locale = useLocale()

  return (
    <div className="rounded-xl border border-border/60 bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {!item.read_at ? (
            <span className="inline-flex size-2.5 rounded-full bg-primary" />
          ) : (
            <span className="inline-flex size-2.5 rounded-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.read_at ? null : (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {t("status.unread")}
              </span>
            )}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {formatDateTime(item.created_at, locale)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {!item.read_at ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onMarkRead(item.id)}
                >
                  {t("actions.markRead")}
                </Button>
              ) : null}
              {item.action_url ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (!item.read_at) {
                      await onMarkRead(item.id)
                    }

                    window.location.href = item.action_url || ROUTER_ENUM.DASHBOARD
                  }}
                >
                  {t("actions.open")}
                </Button>
              ) : null}
              {!item.archived_at ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void onArchive(item.id)}
                >
                  {t("actions.archive")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationsPageView({
  items,
  total,
  totalPages,
  page,
  unreadCount,
  archived,
  unreadOnly,
  isFetching,
  setArchived,
  setUnreadOnly,
  setPage,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onArchive,
}: NotificationsPageViewProps) {
  const t = useTranslations("notifications")

  return (
    <div className="w-full px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-muted/70 px-6 py-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">{t("inboxPage.title")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("inboxPage.description")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("inboxPage.summary", { total, unread: unreadCount })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={!archived && !unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setArchived(false)
                setUnreadOnly(false)
              }}
            >
              {t("filters.all")}
            </Button>
            <Button
              type="button"
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              {t("filters.unreadOnly")}
            </Button>
            <Button
              type="button"
              variant={archived ? "default" : "outline"}
              size="sm"
              onClick={() => setArchived(!archived)}
            >
              {t("filters.archived")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
              {t("actions.refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onMarkAllRead()}
              disabled={unreadCount === 0}
            >
              {t("actions.markAllRead")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("inboxPage.listTitle")}</CardTitle>
            <CardDescription>{t("inboxPage.listDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetching && items.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-background p-4"
                >
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {t("inboxPage.empty")}
              </div>
            ) : (
              items.map((item) => (
                <NotificationListItem
                  key={item.id}
                  item={item}
                  onMarkRead={onMarkRead}
                  onArchive={onArchive}
                />
              ))
            )}

            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {t("inboxPage.pagination", { page, totalPages, total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-4" />
                  {t("actions.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  {t("actions.next")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
