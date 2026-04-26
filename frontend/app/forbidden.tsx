"use client"
import "./globals.css"
import Error from "@/components/topui/error"
import { useI18n } from "@/providers/i18n-provider"

export default function Forbidden() {
  const { t } = useI18n()

  return (
    <Error
      src="/svg/403.svg"
      alt={t("errors.forbidden.alt")}
      title={t("errors.forbidden.title")}
      description={t("errors.forbidden.description")}
      buttonText={t("errors.forbidden.button")}
      herf="/"
    />
  )
}
