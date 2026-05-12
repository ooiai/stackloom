import type { TranslateFn } from "@/lib/i18n"
import type { TenantApplyMembershipStatus } from "@/types/base.types"

export function getTenantApplyStatusMeta(
  status: TenantApplyMembershipStatus,
  t: TranslateFn
) {
  switch (status) {
    case 2:
      return {
        label: t("tenant-apply.status.pending"),
        badgeVariant: "warning" as const,
      }
    case 1:
      return {
        label: t("tenant-apply.status.approved"),
        badgeVariant: "success" as const,
      }
    case 0:
    default:
      return {
        label: t("tenant-apply.status.rejected"),
        badgeVariant: "destructive" as const,
      }
  }
}

export function getTenantApplyStatusOptions(t: TranslateFn) {
  return [
    { value: 2 as TenantApplyMembershipStatus, label: t("tenant-apply.status.pending") },
    { value: 1 as TenantApplyMembershipStatus, label: t("tenant-apply.status.approved") },
    { value: 0 as TenantApplyMembershipStatus, label: t("tenant-apply.status.rejected") },
  ]
}
