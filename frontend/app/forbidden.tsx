import "./globals.css"
import Error from "@/components/topui/error"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

export default async function Forbidden() {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return (
    <Error
      src="/svg/403.svg"
      alt={getMessageValue(messages, "errors.forbidden.alt", "403")}
      title={getMessageValue(messages, "errors.forbidden.title", "此路不通")}
      description={getMessageValue(
        messages,
        "errors.forbidden.description",
        "权限门禁把我们拦住了，请稍后再试。"
      )}
      buttonText={getMessageValue(messages, "errors.forbidden.button", "返回首页")}
      herf="/"
    />
  )
}
