"use client"

import { RoleMutateSheet } from "@/components/base/roles/role-mutate-sheet"
import { useRolesController } from "@/components/base/roles/hooks/use-roles-controller"
import { RolesPageView } from "@/components/base/roles/roles-page-container"

export default function RolesPage() {
  const { view, sheet } = useRolesController()

  return (
    <>
      <RolesPageView {...view} />

      <RoleMutateSheet
        key={`${sheet.mode}-${sheet.role?.id ?? "new"}-${sheet.parent?.id ?? "root"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        role={sheet.role}
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
