"use client"

import BaseHeader from "@/components/base/shared/base-header"
import { SpinnerOverlay } from "@/components/topui/spinner-overlay"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<SpinnerOverlay visible delay={300} />}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <NuqsAdapter>
          <BaseHeader />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </NuqsAdapter>
      </ThemeProvider>
    </Suspense>
  )
}
