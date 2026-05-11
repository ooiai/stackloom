"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ROUTER_ENUM } from "@/lib/config/enums"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import * as React from "react"
import { useWebCurrentMenus } from "./hooks/use-web-current-menus"
import type { MenuTreeNodeData } from "@/types/base.types"
import type { NotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"
import { WebHeaderNotificationBell } from "./web-notification-bell"
import { useI18n } from "@/providers/i18n-provider"

function isMenuMatched(pathname: string, path: string | null) {
  if (!path || path === "/") {
    return false
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

function collectMatchedMenuTitles(
  nodes: MenuTreeNodeData[],
  pathname: string,
  matches: { title: string; pathLength: number }[]
) {
  for (const node of nodes) {
    if (!node.visible || node.status !== 1 || node.menu_type === 3) {
      continue
    }

    if (node.menu_type === 2 && isMenuMatched(pathname, node.path)) {
      matches.push({ title: node.name, pathLength: node.path?.length ?? 0 })
    }

    if (node.children.length > 0) {
      collectMatchedMenuTitles(node.children, pathname, matches)
    }
  }
}

function resolveCurrentMenuTitle(nodes: MenuTreeNodeData[], pathname: string) {
  const matches: { title: string; pathLength: number }[] = []
  collectMatchedMenuTitles(nodes, pathname, matches)

  if (matches.length === 0) {
    return null
  }

  matches.sort((a, b) => b.pathLength - a.pathLength)
  return matches[0]?.title ?? null
}

function fallbackTitleFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).pop()
  if (!segment) {
    return "Dashboard"
  }

  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AppHeader({
  notificationBellData,
}: {
  notificationBellData: NotificationBellData
}) {
  const { t } = useI18n()
  const pathname = usePathname()
  const { menus } = useWebCurrentMenus()
  const currentMenuTitle = React.useMemo(
    () => resolveCurrentMenuTitle(menus, pathname),
    [menus, pathname]
  )

  const ROUTE_TITLE_KEYS: Partial<Record<string, string>> = React.useMemo(
    () => ({
      [ROUTER_ENUM.NOTIFICATIONS]: "notifications.inboxPage.title",
      [ROUTER_ENUM.DASHBOARD]: "navigation.dashboard.page.title",
      [ROUTER_ENUM.MEMBER]: "members.page.title",
    }),
    []
  )

  const routeKey = ROUTE_TITLE_KEYS[pathname]
  const title = routeKey
    ? t(routeKey)
    : (currentMenuTitle ?? fallbackTitleFromPathname(pathname))

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 self-center" />
        <Separator
          orientation="vertical"
          className="mx-1 data-vertical:h-5 data-vertical:self-center"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap items-center">
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-48 truncate sm:max-w-xs">
                {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <WebHeaderNotificationBell data={notificationBellData} />
      </div>
    </header>
  )
}
