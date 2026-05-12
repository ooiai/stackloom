"use client"

import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/providers/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { parseAsInteger, useQueryState } from "nuqs"

const STATS_TABS = [
  { key: "overview", path: "/biz/stats/overview" },
  { key: "growth", path: "/biz/stats/growth" },
  { key: "retention", path: "/biz/stats/retention" },
  { key: "behavior", path: "/biz/stats/behavior" },
  { key: "funnel", path: "/biz/stats/funnel" },
  { key: "commercial", path: "/biz/stats/commercial" },
] as const

export default function BizStatsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const [days, setDays] = useQueryState("days", parseAsInteger.withDefault(30))

  const rangeOptions = [
    { value: 7, label: t("stats.range.days7") },
    { value: 14, label: t("stats.range.days14") },
    { value: 30, label: t("stats.range.days30") },
    { value: 90, label: t("stats.range.days90") },
  ]

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title={t("stats.title")}
        description={t("stats.description")}
        actions={
          <Select
            value={String(days)}
            onValueChange={(v: string | null) => { if (v) setDays(Number(v)) }}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border/60 pb-0">
        {STATS_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.path)
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`${tab.path}?days=${days}`)}
              className={
                "whitespace-nowrap rounded-t px-4 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t(`stats.tabs.${tab.key}`)}
            </button>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
