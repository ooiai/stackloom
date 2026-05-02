import { Badge } from "@/components/reui/badge"
import { getRoleStatusMeta } from "@/components/base/roles/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { RoleStatus } from "@/types/base.types"

export function RoleStatusBadge({ status }: { status: RoleStatus }) {
  const { t } = useI18n()
  const meta = getRoleStatusMeta(status, t)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
