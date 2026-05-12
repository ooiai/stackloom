"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import { RefreshCwIcon } from "lucide-react"

interface TenantApplyPageHeaderProps {
  isFetching: boolean
  onRefresh: () => void
}

export function TenantApplyPageHeader({
  isFetching,
  onRefresh,
}: TenantApplyPageHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t("tenant-apply.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("tenant-apply.description")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          {t("common.actions.refresh")}
        </Button>
      </div>
    </div>
  )
}
