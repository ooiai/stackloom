import type { Metadata } from "next"

import { Toaster } from "@/components/ui/sonner"
import { AxiosErrorHandler } from "@/hooks/setup-axios"
import { fontVariables } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { AlertDialogProvider } from "@/providers/dialog-providers"
import { QueryProviders } from "@/providers/query-providers"

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
    <div className={cn(fontVariables, "min-h-svh font-sans antialiased")}>
      <AlertDialogProvider>
        <QueryProviders>{children}</QueryProviders>
      </AlertDialogProvider>
      <AxiosErrorHandler />
      <Toaster richColors />
    </div>
  )
}
