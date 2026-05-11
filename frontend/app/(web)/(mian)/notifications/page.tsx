"use client"

import { useWebNotificationsController } from "@/components/web/notifications/hooks/use-web-notifications-controller"
import { NotificationsPageView } from "@/components/web/notifications/notifications-page-view"

export default function NotificationsPage() {
  const controller = useWebNotificationsController()

  return <NotificationsPageView {...controller} />
}
