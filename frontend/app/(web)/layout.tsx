import type { Metadata } from "next"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AxiosErrorHandler } from "@/hooks/setup-axios"
import { fontVariables } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { AlertDialogProvider } from "@/providers/dialog-providers"
import { QueryProviders } from "@/providers/query-providers"
import "../globals.css"

export const metadata: Metadata = {
  title: "Stackloom Web",
  description: "Stackloom 前台站点与产品入口。",
}

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
        />
      </head>
      <body className={cn(fontVariables, "font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AlertDialogProvider>
            <QueryProviders>{children}</QueryProviders>
          </AlertDialogProvider>
          <AxiosErrorHandler />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
