"use client"

import { useI18n } from "@/providers/i18n-provider"

export function StatsCommercialContainer() {
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-border/70 bg-card p-10 text-center shadow-sm">
      <p className="text-base font-semibold">{t("stats.commercial.title")}</p>
      <span className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {t("stats.commercial.coming_soon")}
      </span>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
        {t("stats.commercial.coming_soon_desc")}
      </p>
    </div>
  )
}
