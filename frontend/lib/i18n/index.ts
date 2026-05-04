export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export const DEFAULT_TIME_ZONE = "Asia/Shanghai"

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const LOCALE_MESSAGE_MODULES = [
  "common",
  "navigation",
  "metadata",
  "errors",
  "auth",
  "legal",
  "users",
  "dicts",
  "menus",
  "roles",
  "perms",
  "tenants",
  "logs",
] as const

export type LocaleMessageModule = (typeof LOCALE_MESSAGE_MODULES)[number]
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

type MessageModule = Record<string, string | MessageTree>

const MESSAGE_MODULE_LOADERS: Record<
  AppLocale,
  Record<LocaleMessageModule, () => Promise<MessageModule>>
> = {
  "en-US": {
    common: async () => (await import("@/messages/en-US/common.json")).default,
    navigation: async () =>
      (await import("@/messages/en-US/navigation.json")).default,
    metadata: async () =>
      (await import("@/messages/en-US/metadata.json")).default,
    errors: async () => (await import("@/messages/en-US/errors.json")).default,
    auth: async () => (await import("@/messages/en-US/auth.json")).default,
    legal: async () => (await import("@/messages/en-US/legal.json")).default,
    users: async () => (await import("@/messages/en-US/users.json")).default,
    dicts: async () => (await import("@/messages/en-US/dicts.json")).default,
    menus: async () => (await import("@/messages/en-US/menus.json")).default,
    roles: async () => (await import("@/messages/en-US/roles.json")).default,
    perms: async () => (await import("@/messages/en-US/perms.json")).default,
    tenants: async () => (await import("@/messages/en-US/tenants.json")).default,
    logs: async () => (await import("@/messages/en-US/logs.json")).default,
  },
  "zh-CN": {
    common: async () => (await import("@/messages/zh-CN/common.json")).default,
    navigation: async () =>
      (await import("@/messages/zh-CN/navigation.json")).default,
    metadata: async () =>
      (await import("@/messages/zh-CN/metadata.json")).default,
    errors: async () => (await import("@/messages/zh-CN/errors.json")).default,
    auth: async () => (await import("@/messages/zh-CN/auth.json")).default,
    legal: async () => (await import("@/messages/zh-CN/legal.json")).default,
    users: async () => (await import("@/messages/zh-CN/users.json")).default,
    dicts: async () => (await import("@/messages/zh-CN/dicts.json")).default,
    menus: async () => (await import("@/messages/zh-CN/menus.json")).default,
    roles: async () => (await import("@/messages/zh-CN/roles.json")).default,
    perms: async () => (await import("@/messages/zh-CN/perms.json")).default,
    tenants: async () => (await import("@/messages/zh-CN/tenants.json")).default,
    logs: async () => (await import("@/messages/zh-CN/logs.json")).default,
  },
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

  const moduleLoaders = MESSAGE_MODULE_LOADERS[resolvedLocale]
  const moduleEntries = await Promise.all(
    LOCALE_MESSAGE_MODULES.map(async (moduleName) => {
      const moduleMessages = await moduleLoaders[moduleName]()
      return [moduleName, moduleMessages] as const
    })
  )

  return Object.fromEntries(moduleEntries) as MessageTree
}
