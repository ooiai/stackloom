import { Badge } from "@/components/reui/badge"
import { getUserStatusMeta } from "@/lib/users"
import type { UserStatus } from "@/types/base.types"

interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const meta = getUserStatusMeta(status)

  return (
    <Badge variant={meta.badgeVariant} radius="full">
      {meta.label}
    </Badge>
  )
}
