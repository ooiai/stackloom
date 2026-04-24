"use client"

import { useMemo } from "react"

import {
  LayoutWidthToggle,
  type LayoutWidthMode,
} from "@/components/base/shared/layout-width-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { first } from "lodash-es"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/reui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { buildMenuTree, type MenuTreeNode } from "@/lib/tree"
import { cn } from "@/lib/utils"
import { userSharedApi } from "@/stores/base-api"
import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  MenuIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

function MenuGlyph({ icon, className }: { icon?: string; className?: string }) {
  switch (icon) {
    case "ShieldCheck":
      return <ShieldCheckIcon className={className} />
    case "Users":
      return <UsersIcon className={className} />
    default:
      return <LayoutGridIcon className={className} />
  }
}

function isItemActive(item: MenuTreeNode, pathname: string): boolean {
  if (
    item.path &&
    item.path !== "/" &&
    (pathname === item.path || pathname.startsWith(`${item.path}/`))
  ) {
    return true
  }

  return item.children.some((child) => isItemActive(child, pathname))
}

function ListItem({
  title,
  children,
  href,
  icon,
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string
  icon?: string
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={typeof title === "string" ? title : undefined}
        className="group block rounded-2xl border border-transparent px-3 py-3 transition hover:border-border/70 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/60 text-muted-foreground transition duration-200 group-hover:scale-105 group-hover:text-foreground">
            <MenuGlyph icon={icon} className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {title}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {children}
            </p>
          </div>
        </div>
      </Link>
    </li>
  )
}

function AdminNavBar({
  data,
  pathname,
  mobile = false,
}: {
  data: MenuTreeNode[]
  pathname: string
  mobile?: boolean
}) {
  const items = first(data)?.children || []

  if (items.length === 0) {
    return null
  }

  if (mobile) {
    return (
      <nav className="space-y-4">
        {items.map((item: MenuTreeNode) => {
          const active = isItemActive(item, pathname)

          return (
            <section key={item.id} className="space-y-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-medium",
                  active ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                <MenuGlyph icon={item.icon} className="size-4" />
                {item.name}
              </div>

              <ul className="space-y-1.5">
                {item.children.map((child: MenuTreeNode) => (
                  <ListItem
                    key={child.id}
                    title={child.name}
                    href={child.path}
                    icon={child.icon}
                  >
                    {child.remark || child.name}
                  </ListItem>
                ))}
              </ul>
            </section>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item: MenuTreeNode) => {
        const active = isItemActive(item, pathname)

        if (item.children.length === 0) {
          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <MenuGlyph icon={item.icon} className="size-4" />
              {item.name}
            </Link>
          )
        }

        return (
          <Popover key={item.id}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-xl px-3",
                    active
                      ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                />
              }
            >
              <MenuGlyph icon={item.icon} className="size-4" />
              {item.name}
              <ChevronDownIcon className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[420px] gap-0 p-1.5">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {item.children.map((child: MenuTreeNode) => (
                  <ListItem
                    key={child.id}
                    title={child.name}
                    href={child.path}
                    icon={child.icon}
                  >
                    {child.remark || child.name}
                  </ListItem>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )
      })}
    </nav>
  )
}

export default function BaseHeader({
  layoutMode = "contained",
  onLayoutModeChange,
}: {
  layoutMode?: LayoutWidthMode
  onLayoutModeChange?: (mode: LayoutWidthMode) => void
}) {
  const pathname = usePathname()
  const { data: currentMenus = [] } = useQuery({
    queryKey: ["listCurrentMenusQuery"],
    queryFn: () => userSharedApi.listCurrentMenus(),
    staleTime: Number.POSITIVE_INFINITY,
  })
  const trees = useMemo(() => buildMenuTree(currentMenus), [currentMenus])

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div
        className={cn(
          "flex h-16 items-center justify-between gap-4 px-4 sm:px-6",
          layoutMode === "full" ? "w-full" : "mx-auto max-w-7xl"
        )}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="打开导航菜单"
                  />
                }
              >
                <MenuIcon className="size-4" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(88vw,24rem)]">
                <AdminNavBar data={trees} pathname={pathname} mobile />
              </PopoverContent>
            </Popover>
          </div>

          <Link
            href="/upms/users"
            className="flex min-w-0 items-center gap-3 text-primary hover:text-primary/90"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <LayoutGridIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                Stackloom Admin
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Base</span>
                <ChevronRightIcon className="size-3" />
                <span>UPMS</span>
              </div>
            </div>
          </Link>

          <AdminNavBar data={trees} pathname={pathname} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onLayoutModeChange ? (
            <LayoutWidthToggle
              mode={layoutMode}
              onModeChange={onLayoutModeChange}
            />
          ) : null}
          <Button variant="outline" size="icon-sm" aria-label="通知">
            <BellIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="设置">
            <Settings2Icon />
          </Button>
          <div className="hidden items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-2.5 py-1.5 sm:flex">
            <Avatar size="sm">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="text-xs font-medium text-foreground">Admin</p>
              <p className="text-[11px] text-muted-foreground">系统管理员</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
