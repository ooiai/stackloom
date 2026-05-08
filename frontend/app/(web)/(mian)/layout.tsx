"use client"

import Loading from "@/app/loading"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/web/shared/app-header"
import { AppSidebar } from "@/components/web/shared/app-sidebar"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense, useSyncExternalStore } from "react"

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // const { mode, setMode } = useBaseLayoutMode()
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
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </NuqsAdapter>
    </Suspense>
  )
}
