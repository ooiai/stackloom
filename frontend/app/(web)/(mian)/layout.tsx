"use client"

import Loading from "@/app/loading"
import { useNotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/web/shared/app-header"
import { AppSidebar } from "@/components/web/shared/app-sidebar"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense, useSyncExternalStore } from "react"

export default function MainRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // const { mode, setMode } = useBaseLayoutMode()
  const notificationBellData = useNotificationBellData()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return <Loading />
  }

  return (
    <Suspense fallback={<SpinnerOverlay visible delay={300} />}>
      <NuqsAdapter>
        <SidebarProvider>
          <AppSidebar notificationBellData={notificationBellData} />
          <SidebarInset className="min-h-svh">
            <AppHeader notificationBellData={notificationBellData} />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </NuqsAdapter>
    </Suspense>
  )
}
