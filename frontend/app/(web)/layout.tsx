import type { Metadata } from "next"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AxiosErrorHandler } from "@/hooks/setup-axios"
import { fontVariables } from "@/lib/fonts"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"
import { cn } from "@/lib/utils"
import { AlertDialogProvider } from "@/providers/dialog-providers"
import { I18nProvider } from "@/providers/i18n-provider"
import { QueryProviders } from "@/providers/query-providers"
import "../globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return {
    title: getMessageValue(messages, "metadata.web.title", "Stackloom Web"),
    description: getMessageValue(
      messages,
      "metadata.web.description",
      "Stackloom website and product entry."
    ),
  }
}

export default async function WebRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
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
          <I18nProvider locale={locale} messages={messages}>
            <AlertDialogProvider>
              <QueryProviders>{children}</QueryProviders>
            </AlertDialogProvider>
            <AxiosErrorHandler />
            <Toaster richColors />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
