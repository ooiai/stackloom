"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import { RefreshCwIcon, UserPlusIcon } from "lucide-react"

interface UsersPageHeaderProps {
  isFetching: boolean
  onRefresh: () => void
  onOpenCreate: () => void
}

export function UsersPageHeader({
  isFetching,
  onRefresh,
  onOpenCreate,
}: UsersPageHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t("users.page.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("users.page.subtitle")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          hidden
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          {t("common.actions.refresh")}
        </Button>
        <Button onClick={onOpenCreate}>
          <UserPlusIcon />
          {t("users.page.create")}
        </Button>
      </div>
    </div>
  )
}
