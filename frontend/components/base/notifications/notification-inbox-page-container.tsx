"use client"

import { Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { formatDateTime } from "@/components/base/notifications/helpers"
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
import { useI18n } from "@/providers/i18n-provider"
import type { UserNotificationData } from "@/types/base.types"

interface NotificationInboxPageContainerProps {
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

function NotificationInboxListItem({
  item,
  onMarkRead,
  onArchive,
}: {
  item: UserNotificationData
  onMarkRead: (id: string) => Promise<void>
  onArchive: (id: string) => Promise<void>
}) {
  const { t, locale } = useI18n()

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
                {t("notifications.status.unread")}
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
                  {t("notifications.actions.markRead")}
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
                  {t("notifications.actions.open")}
                </Button>
              ) : null}
              {!item.archived_at ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void onArchive(item.id)}
                >
                  {t("notifications.actions.archive")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationInboxPageContainer({
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
}: NotificationInboxPageContainerProps) {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <div className="w-full space-y-5">
      <ManagementPageHeader
        title={t("notifications.inboxPage.title")}
        description={t("notifications.inboxPage.description")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {t("notifications.actions.refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onMarkAllRead()}
              disabled={unreadCount === 0 || isFetching}
            >
              {t("notifications.actions.markAllRead")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push(ROUTER_ENUM.TOOLS_NOTIFICATIONS)}
            >
              {t("notifications.inboxPage.manageAction")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="size-4 text-primary" />
            <span>{t("notifications.inboxPage.summary", { total, unread: unreadCount })}</span>
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
              {t("notifications.filters.all")}
            </Button>
            <Button
              type="button"
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              {t("notifications.filters.unreadOnly")}
            </Button>
            <Button
              type="button"
              variant={archived ? "default" : "outline"}
              size="sm"
              onClick={() => setArchived(!archived)}
            >
              {t("notifications.filters.archived")}
            </Button>
          </div>
        </div>
      </ManagementPageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.inboxPage.listTitle")}</CardTitle>
          <CardDescription>{t("notifications.inboxPage.listDescription")}</CardDescription>
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
              {t("notifications.inboxPage.empty")}
            </div>
          ) : (
            items.map((item) => (
              <NotificationInboxListItem
                key={item.id}
                item={item}
                onMarkRead={onMarkRead}
                onArchive={onArchive}
              />
            ))
          )}

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("notifications.inboxPage.pagination", { page, totalPages, total })}
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
                {t("notifications.actions.previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                {t("notifications.actions.next")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
