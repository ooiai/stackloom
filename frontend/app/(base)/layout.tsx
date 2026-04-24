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
  title: "Stackloom 后台管理系统",
  description: "Stackloom 后台管理系统，用于用户、租户、角色与权限的统一管理。",
  keywords: ["Stackloom", "后台管理", "用户管理", "租户管理", "权限管理"],
}

export default function RootLayout({
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
