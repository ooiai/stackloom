import { Badge } from "@/components/reui/badge"
import { getTenantApplyStatusMeta } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantApplyMembershipStatus } from "@/types/base.types"

interface TenantApplyStatusBadgeProps {
  status: TenantApplyMembershipStatus
}

export function TenantApplyStatusBadge({ status }: TenantApplyStatusBadgeProps) {
  const { t } = useI18n()
  const meta = getTenantApplyStatusMeta(status, t)

  return (
    <Badge variant={meta.badgeVariant} radius="full">
      {meta.label}
    </Badge>
  )
}
