import { Badge } from "@/components/reui/badge"
import { getMenuStatusMeta } from "@/components/base/menus/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { MenuStatus } from "@/types/base.types"

export function MenuStatusBadge({ status }: { status: MenuStatus }) {
  const { t } = useI18n()
  const meta = getMenuStatusMeta(status, t)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
