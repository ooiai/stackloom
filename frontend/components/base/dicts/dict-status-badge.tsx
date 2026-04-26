import { getDictStatusMeta } from "@/components/base/dicts/helpers"
import { Badge } from "@/components/reui/badge"
import { useI18n } from "@/providers/i18n-provider"
import type { DictStatus } from "@/types/base.types"

export function DictStatusBadge({ status }: { status: DictStatus }) {
  const { t } = useI18n()
  const meta = getDictStatusMeta(status, t)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
