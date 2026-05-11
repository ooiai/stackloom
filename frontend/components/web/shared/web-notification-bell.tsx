"use client"

import { NotificationBellPopoverWithData } from "@/components/base/notifications/notification-bell-popover"
import type { NotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useI18n } from "@/providers/i18n-provider"
import { cn } from "@/lib/utils"

const sidebarNotificationButtonClass =
  "font-medium text-sidebar-foreground/80 rounded-lg transition-[background-color,color] duration-200 hover:bg-primary/[0.05] hover:text-primary [&_svg]:text-sidebar-foreground/65 hover:[&_svg]:text-primary"

export function WebHeaderNotificationBell({
  data,
}: {
  data: NotificationBellData
}) {
  return <NotificationBellPopoverWithData data={data} />
}

export function WebSidebarNotificationBell({
  data,
}: {
  data: NotificationBellData
}) {
  const { t } = useI18n()
  const { isMobile, state } = useSidebar()
  const collapsed = !isMobile && state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NotificationBellPopoverWithData
          data={data}
          label={collapsed ? undefined : t("navigation.actions.notifications")}
          badgeMode={collapsed ? "floating" : "inline"}
          popoverAlign="end"
          triggerRender={
            <SidebarMenuButton
              tooltip={t("navigation.actions.notifications")}
              className={cn(
                sidebarNotificationButtonClass,
                collapsed ? "justify-center px-0" : undefined
              )}
            />
          }
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
