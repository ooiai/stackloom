"use client"

import { RoleMutateSheet } from "@/components/base/roles/role-mutate-sheet"
import { RoleAssignMenusDialog } from "@/components/base/roles/role-assign-menus-dialog"
import { RoleAssignPermsDialog } from "@/components/base/roles/role-assign-perms-dialog"
import { useRolesController } from "@/components/base/roles/hooks/use-roles-controller"
import { RolesPageView } from "@/components/base/roles/roles-page-container"

export default function RolesPage() {
  const { view, sheet, assignMenusDialog, assignPermsDialog } =
    useRolesController()

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

      <RoleAssignMenusDialog
        open={assignMenusDialog.open}
        role={assignMenusDialog.role}
        menus={assignMenusDialog.menus}
        assignedIds={assignMenusDialog.assignedIds}
        isLoading={assignMenusDialog.isLoading}
        isSaving={assignMenusDialog.isSaving}
        onOpenChange={(open) => {
          if (!open) {
            assignMenusDialog.onClose()
          }
        }}
        onSave={assignMenusDialog.onSave}
      />

      <RoleAssignPermsDialog
        open={assignPermsDialog.open}
        role={assignPermsDialog.role}
        perms={assignPermsDialog.perms}
        assignedIds={assignPermsDialog.assignedIds}
        isLoading={assignPermsDialog.isLoading}
        isSaving={assignPermsDialog.isSaving}
        onOpenChange={(open) => {
          if (!open) {
            assignPermsDialog.onClose()
          }
        }}
        onSave={assignPermsDialog.onSave}
      />
    </>
  )
}
