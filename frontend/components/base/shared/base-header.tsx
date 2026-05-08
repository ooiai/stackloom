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
import Image from "next/image"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/reui/popover"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "@/components/topui/icon"
import type { IconName } from "@/components/topui/icon"
import { useHeaderContext } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { cn } from "@/lib/utils"
import { userSharedApi } from "@/stores/base-api"
import type { MenuTreeNodeData } from "@/types/base.types"
import {
  BellIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  Settings2Icon,
} from "lucide-react"
import { HeaderUserMenu } from "@/components/base/shared/header-user-menu"

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

function ListItem({
  title,
  children,
  href,
  icon,
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string
  icon?: string | null
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={typeof title === "string" ? title : undefined}
        className="group -mx-2 block rounded-md px-2 py-2 transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <div
            hidden={!icon}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground ring-1 ring-border/50 transition-transform duration-200 group-hover:scale-105"
          >
            <LucideIcon
              name={(icon || "LayoutGrid") as IconName}
              fallback={<LayoutGridIcon className="size-4" />}
              className="size-4"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {title}
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
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
  data: MenuTreeNodeData[]
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
        {items.map((item: MenuTreeNodeData) => {
          const active = isItemActive(item, pathname)

          return (
            <section key={item.id} className="space-y-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium",
                  active ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                <LucideIcon
                  name={(item.icon || "LayoutGrid") as IconName}
                  fallback={<LayoutGridIcon className="size-4" />}
                  className="size-4"
                />
                {item.name}
              </div>

              <ul className="space-y-1.5">
                {item.children.map((child: MenuTreeNodeData) => (
                  <ListItem
                    key={child.id}
                    title={child.name}
                    href={child.path ?? "#"}
                    icon={child.icon}
                  >
                    {child.description || child.name}
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
    <nav className="hidden md:block">
      <div className="flex items-center gap-1">
        {items.map((item: MenuTreeNodeData) => {
          const active = isItemActive(item, pathname)

          if (item.children.length === 0) {
            return (
              <Link
                key={item.id}
                href={item.path ?? "#"}
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition",
                  active
                    ? "bg-accent text-foreground"
                    : "text-foreground/80 hover:bg-accent/70 hover:text-foreground"
                )}
              >
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
                      "h-9 rounded-md px-3 text-sm font-medium",
                      active
                        ? "bg-accent text-foreground hover:bg-accent"
                        : "text-foreground/80 hover:bg-accent/70 hover:text-foreground"
                    )}
                  />
                }
              >
                {item.name}
                <ChevronDownIcon className="size-3.5" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-96 gap-0 p-2 md:w-lg lg:w-152"
              >
                <ul className="grid gap-2 md:grid-cols-2">
                  {item.children.map((child: MenuTreeNodeData) => (
                    <ListItem
                      key={child.id}
                      title={child.name}
                      href={child.path ?? "#"}
                      icon={child.icon}
                    >
                      {child.description || child.name}
                    </ListItem>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>
    </nav>
  )
}

export default function BaseHeader({
  layoutMode = "full",
  onLayoutModeChange,
}: {
  layoutMode?: LayoutWidthMode
  onLayoutModeChange?: (mode: LayoutWidthMode) => void
}) {
  const { t } = useI18n()
  const pathname = usePathname()
  const { user } = useHeaderContext()

  const { data: currentMenus = [] } = useQuery({
    queryKey: ["listCurrentMenusQuery"],
    queryFn: () => userSharedApi.listCurrentMenus(),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const trees = useMemo(() => {
    return currentMenus.map((node) => ({
      ...node,
      name: node.name,
      children: node.children.map((child) => ({
        ...child,
        name: child.name,
      })),
    }))
  }, [currentMenus])

  return (
    <header className="border-b px-4 md:px-6">
      <div
        className={cn(
          "flex h-16 items-center justify-between gap-4",
          layoutMode === "full" ? "w-full" : "mx-auto max-w-7xl"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center md:hidden">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("navigation.actions.openMenu")}
                    className="group size-8"
                  />
                }
              >
                <svg
                  className="pointer-events-none"
                  fill="none"
                  height={16}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width={16}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="origin-center -translate-y-1.75 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
                    d="M4 12L20 12"
                  />
                  <path
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    d="M4 12H20"
                  />
                  <path
                    className="origin-center translate-y-1.75 transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
                    d="M4 12H20"
                  />
                </svg>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-1 md:hidden">
                <AdminNavBar data={trees} pathname={pathname} mobile />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="text-primary hover:text-primary/90">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center justify-center text-primary">
                  <Image
                    src="/images/logo.png"
                    alt="Stackloom"
                    width={48}
                    height={48}
                    className="w-auto"
                  />
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t("navigation.brand.title")}
                  </p>
                </div>
              </div>
            </Link>

            <AdminNavBar data={trees} pathname={pathname} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onLayoutModeChange ? (
            <LayoutWidthToggle
              mode={layoutMode}
              onModeChange={onLayoutModeChange}
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("navigation.actions.notifications")}
            className="text-muted-foreground hover:text-foreground"
          >
            <BellIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("navigation.actions.settings")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings2Icon />
          </Button>
          <HeaderUserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
