"use client"

import { useNotificationInboxController } from "@/components/base/notifications/hooks/use-notification-inbox-controller"
import { NotificationInboxPageContainer } from "@/components/base/notifications/notification-inbox-page-container"

export default function NotificationInboxPage() {
  const controller = useNotificationInboxController()

  return <NotificationInboxPageContainer {...controller} />
}
