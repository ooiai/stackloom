"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ChevronRight, LayoutGridIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { LucideIcon } from "@/components/topui/icon"
import type { IconName } from "@/components/topui/icon"
import type { MenuTreeNodeData } from "@/types/base.types"

interface WebNavItem {
  id: string
  title: string
  url: string
  icon?: string | null
  isActive?: boolean
  items?: WebNavItem[]
}

interface WebNavGroup {
  id: string
  label?: string
  items: WebNavItem[]
}

const navGroupLabelClass =
  "px-2 text-[11px] font-semibold tracking-[0.1em] text-primary/70 uppercase"

const navTopLevelItemClass =
  "font-medium text-sidebar-foreground/85 rounded-xl border border-transparent transition-[background-color,color,border-color,box-shadow] duration-200 hover:border-primary/25 hover:bg-primary/15 hover:text-primary data-active:border-primary/40 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_8px_24px_hsl(var(--primary)/0.35)] data-active:ring-1 data-active:ring-inset data-active:ring-white/25 [&_svg]:text-sidebar-foreground/70 hover:[&_svg]:text-primary data-active:[&_svg]:text-primary-foreground"

const navSubItemClass =
  "text-[13px] text-sidebar-foreground/75 rounded-lg border border-transparent transition-[background-color,color,border-color,box-shadow] duration-200 hover:border-primary/20 hover:bg-primary/12 hover:text-primary data-active:border-primary/25 data-active:bg-primary/20 data-active:text-primary data-active:ring-1 data-active:ring-inset data-active:ring-primary/20"

function isItemActive(item: MenuTreeNodeData, pathname: string): boolean {
  if (
    item.path &&
    item.path !== "/" &&
    (pathname === item.path || pathname.startsWith(`${item.path}/`))
  ) {
    return true
  }

  return item.children.some((child) => isItemActive(child, pathname))
}

function normalizeRootNodes(nodes: MenuTreeNodeData[]) {
  const rootChildren = nodes
    .filter((node) => node.parent_id === null)
    .flatMap((node) => node.children)

  if (rootChildren.length > 0) {
    return rootChildren
  }

  return nodes.filter((node) => node.parent_id !== null)
}

function collectNavigableItems(
  nodes: MenuTreeNodeData[],
  pathname: string
): WebNavItem[] {
  return nodes.flatMap((node) => {
    if (!node.visible || node.status !== 1 || node.menu_type === 3) {
      return []
    }

    if (node.menu_type === 1) {
      return collectNavigableItems(node.children, pathname)
    }

    const childItems = collectNavigableItems(node.children, pathname)

    return [
      {
        id: node.id,
        title: node.name,
        url: node.path ?? "#",
        icon: node.icon,
        isActive: isItemActive(node, pathname),
        items: childItems.length > 0 ? childItems : undefined,
      },
    ]
  })
}

function buildNavGroups(nodes: MenuTreeNodeData[], pathname: string): WebNavGroup[] {
  return normalizeRootNodes(nodes).flatMap((node) => {
    if (!node.visible || node.status !== 1 || node.menu_type === 3) {
      return []
    }

    if (node.menu_type === 1) {
      const items = collectNavigableItems(node.children, pathname)

      if (items.length === 0) {
        return []
      }

      return [
        {
          id: node.id,
          label: node.name,
          items,
        },
      ]
    }

    const items = collectNavigableItems([node], pathname)

    if (items.length === 0) {
      return []
    }

    return [
      {
        id: `ungrouped-${node.id}`,
        items,
      },
    ]
  })
}

function NavMainItem({ item }: { item: WebNavItem }) {
  const hasChildren = Boolean(item.items?.length)

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={item.isActive}
          className={navTopLevelItemClass}
          render={<Link href={item.url} />}
        >
          {item.icon ? (
            <LucideIcon
              name={item.icon as IconName}
              fallback={<LayoutGridIcon className="size-4" />}
            />
          ) : (
            <LayoutGridIcon className="size-4" />
          )}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      defaultOpen={item.isActive}
      className="group/collapsible w-full"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          className="w-full"
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.isActive}
              className={navTopLevelItemClass}
            >
              {item.icon ? (
                <LucideIcon
                  name={item.icon as IconName}
                  fallback={<LayoutGridIcon className="size-4" />}
                />
              ) : (
                <LayoutGridIcon className="size-4" />
              )}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub className="mt-1 border-sidebar-border/80">
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton
                  isActive={subItem.isActive}
                  className={navSubItemClass}
                  render={<Link href={subItem.url} />}
                >
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
}: {
  items: MenuTreeNodeData[]
}) {
  const pathname = usePathname()
  const groups = useMemo(() => buildNavGroups(items, pathname), [items, pathname])

  if (groups.length === 0) {
    return null
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label ? (
            <SidebarGroupLabel className={navGroupLabelClass}>
              {group.label}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavMainItem key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
