"use client"

import * as React from "react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useHeaderContext } from "@/hooks/use-header-context"
import { useMyTenants } from "./hooks/use-my-tenants"
import { useWebCurrentMenus } from "./hooks/use-web-current-menus"
import type { NotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"

export function AppSidebar({
  notificationBellData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  notificationBellData: NotificationBellData
}) {
  const { user } = useHeaderContext()
  const { data: teams = [] } = useMyTenants()
  const { menus } = useWebCurrentMenus()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menus} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} notificationBellData={notificationBellData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
