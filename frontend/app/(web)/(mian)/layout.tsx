"use client"

import { useRouter } from "next/navigation"
import Loading from "@/app/loading"
import { useNotificationBellData } from "@/components/base/notifications/hooks/use-notification-bell"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/web/shared/app-header"
import { AppSidebar } from "@/components/web/shared/app-sidebar"
import { useAuthVerification } from "@/hooks/use-auth-verification"
import { ROUTER_ENUM } from "@/lib/config/enums"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense, useEffect, useSyncExternalStore } from "react"

export default function MainRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthVerification()
  const notificationBellData = useNotificationBellData()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(ROUTER_ENUM.SIGNIN)
    }
  }, [isAuthLoading, isAuthenticated, router])

  // Show default loading while auth is being verified
  if (isAuthLoading) {
    return <Loading />
  }

  // Don't render if not authenticated (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Show default loading until mounted on client
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
