"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/reui/popover"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { BellIcon } from "lucide-react"

import { formatDateTime } from "./helpers"
import {
  type NotificationBellData,
  useNotificationBellData,
} from "./hooks/use-notification-bell"

interface NotificationBellPopoverBaseProps {
  data: NotificationBellData
  label?: string
  triggerRender?: React.ReactElement
  triggerClassName?: string
  popoverAlign?: "start" | "center" | "end"
  badgeMode?: "floating" | "inline"
  viewAllHref?: string
}

export function NotificationInboxPanel({
  data,
  onNavigate,
}: {
  data: NotificationBellData
  onNavigate?: () => void
}) {
  const { t, locale } = useI18n()
  return (
    <>
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">
              {t("notifications.bell.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("notifications.bell.unreadCount", { count: data.unreadCount })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={data.onRefresh}
              disabled={data.isFetching}
            >
              {data.isFetching ? <Spinner className="size-4" /> : null}
              {t("common.actions.refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void data.onMarkAllRead()}
              disabled={data.unreadCount === 0 || data.isFetching}
            >
              {t("notifications.actions.markAllRead")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {data.notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {t("notifications.bell.empty")}
          </div>
        ) : (
          data.notifications.map((item) => (
            <div
              key={item.id}
              className="border-b border-border/40 px-4 py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={async () => {
                    if (!item.read_at) {
                      await data.onMarkRead(item.id)
                    }
                    if (item.action_url) {
                      onNavigate?.()
                      window.location.href = item.action_url
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    {!item.read_at ? (
                      <span className="inline-flex size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDateTime(item.created_at, locale)}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void data.onArchive(item.id)}
                >
                  {t("notifications.actions.archive")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function NotificationBellPopoverBase({
  data,
  label,
  triggerRender,
  triggerClassName,
  popoverAlign = "end",
  badgeMode = "floating",
  viewAllHref,
}: NotificationBellPopoverBaseProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  const badge =
    data.unreadCount > 0 ? (
      <span
        className={cn(
          "inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
          badgeMode === "floating"
            ? "absolute top-1 right-1"
            : "ml-auto shrink-0"
        )}
      >
        {data.unreadCount > 99 ? "99+" : data.unreadCount}
      </span>
    ) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          triggerRender ?? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("navigation.actions.notifications")}
              className={cn(
                "relative text-muted-foreground hover:text-foreground",
                triggerClassName
              )}
            />
          )
        }
      >
        <BellIcon />
        {label ? <span className="truncate">{label}</span> : null}
        {badge}
      </PopoverTrigger>
      <PopoverContent align={popoverAlign} className="w-[22rem] overflow-hidden p-0">
        <NotificationInboxPanel data={data} />
        {viewAllHref ? (
          <div className="border-t border-border/60 p-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                setOpen(false)
                router.push(viewAllHref)
              }}
            >
              {t("notifications.actions.viewAll")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export function NotificationBellPopover(
  props: Omit<NotificationBellPopoverBaseProps, "data"> = {}
) {
  const data = useNotificationBellData()

  return <NotificationBellPopoverBase data={data} {...props} />
}

export function NotificationBellPopoverWithData(
  props: NotificationBellPopoverBaseProps
) {
  return <NotificationBellPopoverBase {...props} />
}
