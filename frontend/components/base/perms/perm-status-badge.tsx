import { Badge } from "@/components/reui/badge"
import { getPermStatusMeta } from "@/components/base/perms/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { PermStatus } from "@/types/base.types"

export function PermStatusBadge({ status }: { status: PermStatus }) {
  const { t } = useI18n()
  const meta = getPermStatusMeta(status, t)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
