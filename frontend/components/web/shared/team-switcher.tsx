"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

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
import type { MyTenantData } from "@/types/base.types"

function getActiveTeamCandidate(teams: MyTenantData[]) {
  return teams.find((team) => team.is_current) ?? teams.at(0)
}

export function TeamSwitcher({ teams }: { teams: MyTenantData[] }) {
  const { isMobile } = useSidebar()
  const t = useTranslations("navigation.dashboard.teamSwitcher")
  const tNavUser = useTranslations("navigation.dashboard.navUser")

  const initialActive = getActiveTeamCandidate(teams)
  const [activeTeamState, setActiveTeamState] = React.useState<
    MyTenantData | undefined
  >(initialActive)

  const activeTeam = activeTeamState ?? getActiveTeamCandidate(teams)

  if (!activeTeam) {
    return null
  }

  const avatarChar = (name: string) => name.slice(0, 2).toUpperCase()

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
                  {avatarChar(activeTeam.name)}
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeTeam.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeTeam.plan_code ?? tNavUser("planFallback")}
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
                onClick={() => setActiveTeamState(team)}
                className="gap-2 p-2 hover:bg-primary/5 focus:bg-primary/5"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs font-semibold">
                  {avatarChar(team.name)}
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
