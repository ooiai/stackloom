"use client"

import { NotificationsPageContainer } from "@/components/base/notifications/notifications-page-container"
import { NotificationsRuleDialog } from "@/components/base/notifications/notifications-rule-dialog"
import { NotificationsSendDialog } from "@/components/base/notifications/notifications-send-dialog"
import { NotificationsTemplateDialog } from "@/components/base/notifications/notifications-template-dialog"
import { useNotificationsController } from "@/components/base/notifications/hooks/use-notifications-controller"

export default function NotificationsPage() {
  const controller = useNotificationsController()

  return (
    <>
      <NotificationsPageContainer {...controller.view} />

      <NotificationsSendDialog {...controller.sendDialog} />
      <NotificationsTemplateDialog {...controller.templateDialog} />
      <NotificationsRuleDialog {...controller.ruleDialog} />
    </>
  )
}
