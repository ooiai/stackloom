import { cookies } from "next/headers"

import { LOCALE_COOKIE_NAME } from "@/lib/config/constants"
import { resolveLocale } from "@/lib/i18n"

export async function getRequestLocale() {
  const cookieStore = await cookies()
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value)
}
