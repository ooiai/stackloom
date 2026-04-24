"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BellIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  SearchIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

const navigationItems = [
  {
    href: "/upms/users",
    label: "用户",
    icon: UsersIcon,
  },
]

export default function BaseHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
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
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <SearchIcon className="size-4" />
              <span className="truncate">搜索用户、租户或权限模块</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        <nav className="flex items-center gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}

          <div className="ml-auto hidden items-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2 text-xs font-medium text-emerald-700 md:flex dark:text-emerald-400">
            <ShieldCheckIcon className="size-3.5" />
            当前区域：权限与账号管理
          </div>
        </nav>
      </div>
    </header>
  )
}
