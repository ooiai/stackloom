"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

interface OAuthClientsPageHeaderProps {
  canCreate: boolean
  isFetching: boolean
  onRefresh: () => void
  onOpenCreate: () => void
}

export function OAuthClientsPageHeader({
  canCreate,
  isFetching,
  onRefresh,
  onOpenCreate,
}: OAuthClientsPageHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t("oauth-clients.page.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("oauth-clients.page.subtitle")}
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
        {canCreate ? (
          <Button onClick={onOpenCreate}>
            <PlusIcon />
            {t("oauth-clients.page.create")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
