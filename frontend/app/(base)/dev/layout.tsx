"use client"

import Loading from "@/app/loading"
import BaseHeader from "@/components/base/shared/base-header"
import { useBaseLayoutMode } from "@/hooks/use-base-layout-mode"
import { Suspense, useSyncExternalStore } from "react"

export default function DevRootLayout({
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
    <Suspense fallback={null}>
      <div className="flex min-h-svh flex-col">
        <BaseHeader layoutMode={mode} onLayoutModeChange={setMode} />
        <main className="mx-auto w-full max-w-384 flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </Suspense>
  )
}
