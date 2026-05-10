"use client"

import { createContext, useCallback, useContext, useMemo } from "react"

import { LOCALE_COOKIE_NAME } from "@/lib/config/constants"
import { type AppLocale, DEFAULT_TIME_ZONE, type TranslateFn } from "@/lib/i18n"
import { NextIntlClientProvider, useLocale, useTranslations } from "next-intl"

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface I18nContextValue {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nContextValue | null>(null)

function writeLocaleCookie(locale: AppLocale) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(
    locale
  )}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
}

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode
  locale: AppLocale
  messages: Record<string, unknown>
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={DEFAULT_TIME_ZONE}
    >
      <I18nContextBridge>{children}</I18nContextBridge>
    </NextIntlClientProvider>
  )
}

function I18nContextBridge({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as AppLocale
  const t = useTranslations()

  const setLocale = useCallback((nextLocale: AppLocale) => {
    writeLocaleCookie(nextLocale)
    window.location.reload()
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values, fallback) => {
        try {
          return t(key, values)
        } catch {
          return fallback ?? key
        }
      },
    }),
    [locale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }

  return context
}
