"use client"

import { useCallback } from "react"

import { IconDotsVertical, IconLogout } from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROUTER_ENUM, STORAGE_ENUM } from "@/lib/config/enums"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
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

  const displayName =
    user?.nickname ??
    user?.username ??
    t("navigation.profile.fallbackName")
  const tenantName = user?.tenant_name ?? t("navigation.profile.fallbackMeta")
  const detailMeta = user?.username ?? tenantName
  const compactOnMobile = mobileMode === "compact"

  const handleLogout = useCallback(async () => {
    try {
      await signinApi.logout()
    } finally {
      removeStorageItem(STORAGE_ENUM.TOKEN)
      window.location.href = ROUTER_ENUM.SIGNIN
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "cursor-pointer items-center gap-3 rounded-md border-s border-border/60 p-2 ps-3 pe-2 text-start transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50",
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
          <AvatarFallback>{getNameAbbr(displayName || "SL")}</AvatarFallback>
        </Avatar>
        <div className={cn("min-w-0 leading-tight", compactOnMobile && "hidden sm:block")}>
          <p className="truncate text-xs font-medium text-foreground">
            {displayName}
          </p>
          <p className="text-[11px] text-muted-foreground">{tenantName}</p>
        </div>
        <IconDotsVertical
          className={cn(
            "size-3.5 text-muted-foreground",
            compactOnMobile && "hidden sm:block"
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="min-w-60 rounded-lg"
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar size="default">
            {user?.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={displayName} />
            )}
            <AvatarFallback>{getNameAbbr(displayName || "SL")}</AvatarFallback>
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

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <IconLogout className="size-4" />
          {t("navigation.profile.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
