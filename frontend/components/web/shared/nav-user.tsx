"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ROUTER_ENUM, STORAGE_ENUM } from "@/lib/config/enums"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import { signinApi } from "@/stores/auth-api"
import type { HeaderContextUserData } from "@/types/base.types"

export function NavUser({ user }: { user: HeaderContextUserData | null }) {
  const { isMobile } = useSidebar()
  const t = useTranslations("navigation.dashboard.navUser")

  const displayName = user?.nickname ?? user?.username ?? t("account")
  const tenantName = user?.tenant_name ?? t("planFallback")
  const avatarUrl = user?.avatar_url ?? ""
  const avatarFallback = displayName.slice(0, 2).toUpperCase() || "U"

  async function handleLogout() {
    try {
      await signinApi.logout()
    } finally {
      removeStorageItem(STORAGE_ENUM.TOKEN)
      window.location.href = ROUTER_ENUM.SIGNIN
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="rounded-xl border border-transparent bg-gradient-to-r from-background/90 to-muted/40 transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-primary/25 hover:bg-primary/15 hover:text-primary data-[state=open]:border-primary/35 data-[state=open]:bg-primary/20 data-[state=open]:text-primary data-[state=open]:shadow-[0_10px_24px_hsl(var(--primary)/0.22)] data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-primary/25"
              >
                <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/70">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {tenantName}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{tenantName}</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                {t("upgrade")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                {t("account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                {t("notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
