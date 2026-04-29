import { Badge } from "@/components/reui/badge"
import { getUserStatusMeta } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { UserStatus } from "@/types/base.types"

interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { t } = useI18n()
  const meta = getUserStatusMeta(status, t)

  return (
    <Badge variant={meta.badgeVariant} radius="full">
      {meta.label}
    </Badge>
  )
}
