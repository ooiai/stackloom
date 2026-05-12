import { Badge } from "@/components/reui/badge"
import { useI18n } from "@/providers/i18n-provider"
import type { OAuthClientStatus } from "@/types/base.types"

interface OAuthClientStatusBadgeProps {
  status: OAuthClientStatus
}

export function OAuthClientStatusBadge({ status }: OAuthClientStatusBadgeProps) {
  const { t } = useI18n()
  const label =
    status === 1
      ? t("oauth-clients.status.enabled")
      : t("oauth-clients.status.disabled")
  const variant = status === 1 ? "success-light" : "secondary"

  return (
    <Badge variant={variant} radius="full">
      {label}
    </Badge>
  )
}
