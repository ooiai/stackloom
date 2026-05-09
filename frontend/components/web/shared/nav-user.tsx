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
import { useAlertDialog } from "@/providers/dialog-providers"
import { signinApi } from "@/stores/auth-api"
import type { HeaderContextUserData } from "@/types/base.types"
import { getNameAbbr } from "@/lib/core"

export function NavUser({ user }: { user: HeaderContextUserData | null }) {
  const { isMobile } = useSidebar()
  const t = useTranslations("navigation.dashboard.navUser")
  const dialog = useAlertDialog()

  const displayName = user?.nickname ?? user?.username ?? t("account")
  const tenantName = user?.tenant_name ?? t("planFallback")

  async function executeLogout() {
    try {
      await signinApi.logout()
    } finally {
      removeStorageItem(STORAGE_ENUM.TOKEN)
      window.location.href = ROUTER_ENUM.SIGNIN
    }
  }

  function handleLogout() {
    dialog.show({
      title: t("logoutConfirmTitle"),
      description: t("logoutConfirmDescription"),
      cancelText: t("logoutConfirmCancel"),
      confirmText: t("logoutConfirmAction"),
      autoCloseOnConfirm: true,
      onConfirm: executeLogout,
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="rounded-lg bg-background transition-[background-color,color] duration-200 hover:bg-primary/[0.05] hover:text-primary data-[state=open]:bg-primary/[0.08] data-[state=open]:text-primary"
              >
                <Avatar size="default">
                  {user?.avatar_url && (
                    <AvatarImage
                      className="bg-primary/5"
                      src={user.avatar_url}
                      alt={displayName}
                    />
                  )}
                  <AvatarFallback>
                    {getNameAbbr(displayName || "SL")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <p className="truncate text-xs font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tenantName}
                  </p>
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
                <Avatar size="default">
                  {user?.avatar_url && (
                    <AvatarImage
                      className="bg-primary/5"
                      src={user.avatar_url}
                      alt={displayName}
                    />
                  )}
                  <AvatarFallback>
                    {getNameAbbr(displayName || "SL")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <p className="truncate text-xs font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tenantName}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="hover:bg-primary/5 focus:bg-primary/5">
                <Sparkles />
                {t("upgrade")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="hover:bg-primary/5 focus:bg-primary/5">
                <BadgeCheck />
                {t("account")}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-primary/5 focus:bg-primary/5">
                <CreditCard />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-primary/5 focus:bg-primary/5">
                <Bell />
                {t("notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-primary/5 focus:bg-primary/5"
            >
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
