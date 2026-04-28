import { Badge } from "@/components/reui/badge"
import { getTenantStatusMeta } from "@/components/base/tenants/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { TenantStatus } from "@/types/base.types"

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const { t } = useI18n()
  const meta = getTenantStatusMeta(status, t)

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
}
