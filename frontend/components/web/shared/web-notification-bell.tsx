"use client"

import { NotificationBellPopoverWithData } from "@/components/base/notifications/notification-bell-popover"
import { ROUTER_ENUM } from "@/lib/config/enums"
import type { NotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"

export function WebHeaderNotificationBell({
  data,
}: {
  data: NotificationBellData
}) {
  return (
    <NotificationBellPopoverWithData
      data={data}
      viewAllHref={ROUTER_ENUM.NOTIFICATIONS}
    />
  )
}
