export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export type TranslationValues = Record<string, string | number>
export type TranslateFn = (
  key: string,
  values?: TranslationValues,
  fallback?: string
) => string

export const DEFAULT_LOCALE: AppLocale = "zh-CN"

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  )
}

export function resolveLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

export interface MessageTree {
  [key: string]: string | MessageTree
}

export function getMessageValue(
  messages: MessageTree,
  path: string,
  fallback = ""
) {
  const value = path.split(".").reduce<string | MessageTree | undefined>(
    (current, segment) =>
      current && typeof current === "object" ? current[segment] : undefined,
    messages
  )

  return typeof value === "string" ? value : fallback
}

export async function getLocaleMessages(locale: AppLocale) {
  const resolvedLocale = resolveLocale(locale)

  switch (resolvedLocale) {
    case "en-US":
      return (await import("@/messages/en-US.json")).default as MessageTree
    case "zh-CN":
    default:
      return (await import("@/messages/zh-CN.json")).default as MessageTree
  }
}
