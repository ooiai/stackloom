"use client"

import { useTenantApplyController } from "@/components/base/tenant-apply/hooks/use-tenant-apply-controller"
import { TenantApplyPageView } from "@/components/base/tenant-apply/tenant-apply-page-container"

export default function BizApplyPage() {
  const { view } = useTenantApplyController()

  return <TenantApplyPageView {...view} />
}
