"use client"

import { useMemo, useState } from "react"

import { ChevronsUpDown, LogOut, Settings2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { AccountSettingsDialog } from "@/components/base/shared/account-settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
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
  const router = useRouter()
  const t = useTranslations("navigation.dashboard.navUser")
  const dialog = useAlertDialog()
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const displayName = user?.nickname ?? user?.username ?? t("account")
  const username = user?.username ?? t("planFallback")

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

  function handleOpenSettings() {
    setMenuOpen(false)

    if (typeof window === "undefined") {
      setSettingsOpen(true)
      return
    }

    window.setTimeout(() => {
      setSettingsOpen(true)
    }, 0)
  }

  function handleOpenPricing() {
    setMenuOpen(false)
    router.push(ROUTER_ENUM.PRICING)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
                    <p className="truncate text-[11px] text-muted-foreground">
                      {username}
                    </p>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl p-1.5"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <div className="rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-border/50">
                <div className="flex items-center gap-3">
                  <Avatar size="default">
                    {user?.avatar_url && (
                      <AvatarImage
                        className="bg-primary/5"
                        src={user.avatar_url}
                        alt={displayName}
                      />
                    )}
                    <AvatarFallback className="bg-primary/5">
                      {getNameAbbr(displayName || "SL")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left leading-tight">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {username}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={handleOpenSettings}
                className="gap-1.5 rounded-md px-2 py-2 hover:bg-primary/5 focus:bg-primary/5"
              >
                <Settings2 className="size-4" />
                {t("account")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleOpenPricing}
                className="gap-1.5 rounded-md px-2 py-2 hover:bg-primary/5 focus:bg-primary/5"
              >
                <Sparkles className="size-4" />
                {t("upgrade")}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                className="rounded-md"
              >
                <LogOut className="size-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AccountSettingsDialog
        user={user}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
