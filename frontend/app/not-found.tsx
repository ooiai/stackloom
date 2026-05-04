import "./globals.css"
import Error from "@/components/topui/error"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

export default async function NotFound() {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return (
    <Error
      src="/svg/404.svg"
      alt={getMessageValue(messages, "errors.notFound.alt", "404")}
      title={getMessageValue(messages, "errors.notFound.title", "页面丢失了")}
      description={getMessageValue(
        messages,
        "errors.notFound.description",
        "抱歉，您访问的页面不存在或已被移除。"
      )}
      buttonText={getMessageValue(messages, "errors.notFound.button", "返回首页")}
      herf="/"
    />
  )
}
