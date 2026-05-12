"use client"

import Loading from "@/app/loading"
import BaseHeader from "@/components/base/shared/base-header"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { useBaseLayoutMode } from "@/hooks/use-base-layout-mode"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense, useSyncExternalStore } from "react"

export default function UpmsRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { mode, setMode } = useBaseLayoutMode()
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
        <div className="flex min-h-svh flex-col">
          <BaseHeader layoutMode={mode} onLayoutModeChange={setMode} />
          <main className="mx-auto w-full max-w-420 flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
        </div>
      </NuqsAdapter>
    </Suspense>
  )
}
