"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM, ROUTER_ENUM } from "@/lib/config/enums"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAlertDialog } from "@/providers/dialog-providers"
import { signinApi } from "@/stores/auth-api"
import type { MyTenantData } from "@/types/base.types"
import { getNameAbbr } from "@/lib/core"

function getActiveTeamCandidate(teams: MyTenantData[]) {
  return teams.find((team) => team.is_current) ?? teams.at(0)
}

function getTeamMeta(team: MyTenantData, fallback: string) {
  const roleNames = team.role_names
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  return roleNames.length > 0 ? roleNames.join(", ") : fallback
}

export function TeamSwitcher({ teams }: { teams: MyTenantData[] }) {
  const { isMobile } = useSidebar()
  const dialog = useAlertDialog()
  const t = useTranslations("navigation.dashboard.teamSwitcher")
  const tNavUser = useTranslations("navigation.dashboard.navUser")

  const activeTeam = getActiveTeamCandidate(teams)

  const handleSwitchTeam = React.useCallback(
    (team: MyTenantData) => {
      if (team.is_current) {
        return
      }

      dialog.show({
        title: t("confirmTitle"),
        description: t("confirmDescription", { team: team.name }),
        confirmText: t("confirmAction"),
        cancelText: t("confirmCancel"),
        autoCloseOnConfirm: true,
        onConfirm: async () => {
          const data = await signinApi.switchAccountAuth({
            membership_id: team.membership_id,
            tenant_id: team.id,
          })

          setStorageItem(
            STORAGE_ENUM.TOKEN,
            JSON.stringify(data),
            data.refresh_expires_at
          )
          window.location.href = ROUTER_ENUM.DASHBOARD
        },
      })
    },
    [dialog, t]
  )

  if (!activeTeam) {
    return null
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
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  {getNameAbbr(activeTeam.name)}
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeTeam.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getTeamMeta(activeTeam, tNavUser("planFallback"))}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto shrink-0" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
              {t("switchLabel")}
            </div>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitchTeam(team)}
                disabled={team.is_current}
                className="gap-2 p-2 hover:bg-primary/5 focus:bg-primary/5"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs font-semibold">
                  {getNameAbbr(team.name)}
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 hover:bg-primary/5 focus:bg-primary/5">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                {t("addTeam")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
