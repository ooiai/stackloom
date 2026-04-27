"use client"

import BaseHeader from "@/components/base/shared/base-header"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { useBaseLayoutMode } from "@/hooks/use-base-layout-mode"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { mode, setMode } = useBaseLayoutMode()

  return (
    <Suspense fallback={<SpinnerOverlay visible delay={300} />}>
      <NuqsAdapter>
        <BaseHeader layoutMode={mode} onLayoutModeChange={setMode} />
        <main className="mx-auto max-w-384 px-4 py-8 sm:px-6">{children}</main>
      </NuqsAdapter>
    </Suspense>
  )
}
