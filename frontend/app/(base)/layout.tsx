"use client"

import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AxiosErrorHandler } from "@/hooks/setup-axios"
import { fontVariables } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { AlertDialogProvider } from "@/providers/dialog-providers"
import { QueryProviders } from "@/providers/query-providers"

export default function BaseLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div
      className={cn(
        fontVariables,
        "min-h-svh bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_10%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white),var(--background))] font-sans antialiased"
      )}
    >
      <AlertDialogProvider>
        <QueryProviders>
          <TooltipProvider>
            <div className="relative min-h-svh">
              <header className="border-b border-border/70 bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-2xl text-sm font-semibold">
                      S
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold tracking-tight">
                        Stackloom Console
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Base / UPMS
                      </p>
                    </div>
                  </div>
                  <p className="hidden text-xs text-muted-foreground md:block">
                    更清晰的信息层级，更稳定的后台数据操作流
                  </p>
                </div>
              </header>

              <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                {children}
              </main>
            </div>
          </TooltipProvider>
        </QueryProviders>

        <AxiosErrorHandler />
        <Toaster richColors />
      </AlertDialogProvider>
    </div>
  )
}
