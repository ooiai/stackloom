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
                className="rounded-xl border border-transparent bg-gradient-to-r from-background/90 to-muted/40 transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-primary/25 hover:bg-primary/15 hover:text-primary data-[state=open]:border-primary/35 data-[state=open]:bg-primary/20 data-[state=open]:text-primary data-[state=open]:shadow-[0_10px_24px_hsl(var(--primary)/0.22)] data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-primary/25"
              >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground ring-1 ring-border/70">
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
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs font-semibold">
                  {avatarChar(team.name)}
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
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
