"use client"

import { useCallback } from "react"

import { IconDotsVertical, IconLogout } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"

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
import { useI18n } from "@/providers/i18n-provider"
import { sharedApi } from "@/stores/base-api"
import { signinApi } from "@/stores/auth-api"
import { getNameAbbr } from "@/lib/core"

export function HeaderUserMenu() {
  const { t } = useI18n()
  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => sharedApi.getProfile(),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const displayName =
    profile?.nickname ??
    profile?.username ??
    t("navigation.profile.fallbackName")
  const tenantName =
    profile?.tenant_name ?? t("navigation.profile.fallbackMeta")
  const detailMeta =
    profile?.email ??
    profile?.tenant_name ??
    t("navigation.profile.emailUnavailable")

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
        className="hidden cursor-pointer items-center gap-3 rounded-md border-s border-border/60 p-2 ps-3 pe-2 text-start transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50 lg:flex"
        aria-label={t("navigation.profile.openMenu")}
        title={t("navigation.profile.openMenu")}
      >
        <Avatar size="default">
          {profile?.avatar_url && (
            <AvatarImage
              className="bg-primary/5"
              src={profile.avatar_url}
              alt={displayName}
            />
          )}
          <AvatarFallback>{getNameAbbr(displayName || "SL")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-medium text-foreground">
            {displayName}
          </p>
          <p className="text-[11px] text-muted-foreground">{tenantName}</p>
        </div>
        <IconDotsVertical className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="min-w-60 rounded-lg"
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar size="default">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
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
