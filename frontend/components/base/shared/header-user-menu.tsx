"use client"

import { useCallback, useMemo, useState } from "react"

import {
  IconLogout,
  IconSettings,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AccountSettingsDialog } from "@/components/base/shared/account-settings-dialog"
import { ROUTER_ENUM, STORAGE_ENUM } from "@/lib/config/enums"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { useAlertDialog } from "@/providers/dialog-providers"
import { signinApi } from "@/stores/auth-api"
import { getNameAbbr } from "@/lib/core"
import type { HeaderContextUserData } from "@/types/base.types"

type HeaderUserMenuMobileMode = "hidden" | "compact"

export function HeaderUserMenu({
  user,
  mobileMode = "hidden",
}: {
  user: HeaderContextUserData | null
  mobileMode?: HeaderUserMenuMobileMode
}) {
  const { t } = useI18n()
  const dialog = useAlertDialog()
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const displayName =
    user?.nickname ?? user?.username ?? t("navigation.profile.fallbackName")
  const tenantName = user?.tenant_name ?? t("navigation.profile.fallbackMeta")
  const detailMeta = useMemo(() => {
    if (!user?.username) {
      return tenantName
    }

    return `${user.username} · ${tenantName}`
  }, [tenantName, user?.username])
  const compactOnMobile = mobileMode === "compact"

  const executeLogout = useCallback(async () => {
    try {
      await signinApi.logout()
    } finally {
      removeStorageItem(STORAGE_ENUM.TOKEN)
      window.location.href = ROUTER_ENUM.SIGNIN
    }
  }, [])

  const handleLogout = useCallback(() => {
    dialog.show({
      title: t("navigation.profile.logoutConfirmTitle"),
      description: t("navigation.profile.logoutConfirmDescription"),
      cancelText: t("navigation.profile.logoutConfirmCancel"),
      confirmText: t("navigation.profile.logoutConfirmAction"),
      autoCloseOnConfirm: true,
      onConfirm: executeLogout,
    })
  }, [dialog, executeLogout, t])

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false)

    if (typeof window === "undefined") {
      setSettingsOpen(true)
      return
    }

    window.setTimeout(() => {
      setSettingsOpen(true)
    }, 0)
  }, [])

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          className={cn(
            "cursor-pointer items-center gap-3 rounded-md border-s border-border/60 p-2 ps-3 pe-2 text-start transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent/60 data-[state=open]:bg-accent/70",
            compactOnMobile ? "flex" : "hidden lg:flex"
          )}
          aria-label={t("navigation.profile.openMenu")}
          title={t("navigation.profile.openMenu")}
        >
          <Avatar size="default">
            {user?.avatar_url && (
              <AvatarImage
                className="bg-primary/5"
                src={user.avatar_url}
                alt={displayName}
              />
            )}
            <AvatarFallback className="bg-primary/5 text-foreground">
              {getNameAbbr(displayName || "SL")}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="min-w-64 rounded-xl p-1.5"
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
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {detailMeta}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={handleOpenSettings}
            className="gap-1.5 rounded-md px-2 py-2 hover:bg-primary/5 focus:bg-primary/5"
          >
            <IconSettings className="size-4" />
            {t("navigation.profile.accountSettings")}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            className="rounded-md"
          >
            <IconLogout className="size-4" />
            {t("navigation.profile.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog
        user={user}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
