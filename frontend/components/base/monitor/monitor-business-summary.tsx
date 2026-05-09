"use client"

import { ShieldIcon, UserIcon, UsersIcon } from "lucide-react"

import { MetricCard } from "@/components/base/shared/metric-card"
import { useI18n } from "@/providers/i18n-provider"
import type { BusinessSummary } from "@/types/monitor.types"

interface MonitorBusinessSummaryProps {
  businessSummary: BusinessSummary
}

export function MonitorBusinessSummary({ businessSummary }: MonitorBusinessSummaryProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
      <MetricCard
        label={t("monitor.total_users")}
        value={String(businessSummary.total_users)}
        hint={t("monitor.business_title")}
        tone="default"
        icon={<UserIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.total_tenants")}
        value={String(businessSummary.total_tenants)}
        hint={t("monitor.business_title")}
        tone="default"
        icon={<UsersIcon className="size-4" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={t("monitor.total_roles")}
        value={String(businessSummary.total_roles)}
        hint={t("monitor.business_title")}
        tone="default"
        icon={<ShieldIcon className="size-4" />}
        className="xl:col-span-2"
      />
    </div>
  )
}
