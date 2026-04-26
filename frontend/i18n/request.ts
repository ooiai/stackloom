import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { LOCALE_COOKIE_NAME } from "@/lib/config/constants"
import { getLocaleMessages, resolveLocale } from "@/lib/i18n"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value)

  return {
    locale,
    messages: await getLocaleMessages(locale),
  }
})
