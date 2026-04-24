"use client"

import BaseHeader from "@/components/base/shared/base-header"
import { cn } from "@/lib/utils"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { useUpmsLayoutMode } from "@/hooks/use-upms-layout-mode"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { mode, setMode, isFullWidth } = useUpmsLayoutMode()

  return (
    <Suspense fallback={<SpinnerOverlay visible delay={300} />}>
      <NuqsAdapter>
        <BaseHeader layoutMode={mode} onLayoutModeChange={setMode} />
        <main
          className={cn(
            "px-4 py-8 sm:px-6",
            isFullWidth ? "w-full" : "mx-auto max-w-7xl"
          )}
        >
          {children}
        </main>
      </NuqsAdapter>
    </Suspense>
  )
}
