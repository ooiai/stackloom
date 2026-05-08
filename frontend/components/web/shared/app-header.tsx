"use client"

import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HeaderUserMenu } from "@/components/base/shared/header-user-menu"
import { useHeaderContext } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import * as React from "react"

export function AppHeader() {
  const { t } = useI18n()
  const { user } = useHeaderContext()
  const tenantName = user?.tenant_name ?? t("navigation.profile.fallbackMeta")

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link href="/" />}>
                {t("navigation.brand.title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className={cn("truncate", "max-w-[12rem] sm:max-w-xs")}>
                {tenantName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HeaderUserMenu user={user} mobileMode="compact" />
      </div>
    </header>
  )
}
