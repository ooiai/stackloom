import { Badge } from "@/components/reui/badge"
import { getDictStatusMeta } from "@/lib/dicts"
import type { DictStatus } from "@/types/base.types"

export function DictStatusBadge({ status }: { status: DictStatus }) {
  const meta = getDictStatusMeta(status)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
