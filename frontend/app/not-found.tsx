"use client"

import "./globals.css"
import Error from "@/components/topui/error"
import { useI18n } from "@/providers/i18n-provider"

export default function NotFound() {
  const { t } = useI18n()

  return (
    <Error
      src="/svg/404.svg"
      alt={t("errors.notFound.alt")}
      title={t("errors.notFound.title")}
      description={t("errors.notFound.description")}
      buttonText={t("errors.notFound.button")}
      herf="/"
    />
  )
}
