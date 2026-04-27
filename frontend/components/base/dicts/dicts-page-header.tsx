"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

interface DictsPageHeaderProps {
  isFetching: boolean
  onRefresh: () => void
  onOpenCreateRoot: () => void
}

export function DictsPageHeader({
  isFetching,
  onRefresh,
  onOpenCreateRoot,
}: DictsPageHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-md font-bold tracking-tight">
          {t("dicts.page.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dicts.page.subtitle")}
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
        <Button hidden onClick={onOpenCreateRoot}>
          <PlusIcon />
          {t("dicts.page.addRoot")}
        </Button>
      </div>
    </div>
  )
}
