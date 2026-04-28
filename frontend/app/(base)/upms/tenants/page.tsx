"use client"

import { TenantMutateSheet } from "@/components/base/tenants/tenant-mutate-sheet"
import { useTenantsController } from "@/components/base/tenants/hooks/use-tenants-controller"
import { TenantsPageView } from "@/components/base/tenants/tenants-page-container"

export default function TenantsPage() {
  const { view, sheet } = useTenantsController()

  return (
    <>
      <TenantsPageView {...view} />

      <TenantMutateSheet
        key={`${sheet.mode}-${sheet.tenant?.id ?? "new"}-${sheet.parent?.id ?? "root"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        tenant={sheet.tenant}
        parent={sheet.parent}
        isPending={sheet.isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            sheet.onClose()
          }
        }}
        onSubmit={sheet.onSubmit}
      />
    </>
  )
}
