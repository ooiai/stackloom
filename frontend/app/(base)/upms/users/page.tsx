"use client"

import { UserMutateSheet } from "@/components/base/users/user-mutate-sheet"
import { UserAssignRolesDialog } from "@/components/base/users/user-assign-roles-dialog"
import { useUsersController } from "@/components/base/users/hooks/use-users-controller"
import { UsersPageView } from "@/components/base/users/users-page-container"

export default function UserPage() {
  const { view, sheet, assignRolesDialog } = useUsersController()

  return (
    <>
      <UsersPageView {...view} />

      <UserMutateSheet
        key={`${sheet.mode}-${sheet.user?.id ?? "new"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        user={sheet.user}
        isPending={sheet.isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            sheet.onClose()
          }
        }}
        onSubmit={sheet.onSubmit}
      />

      <UserAssignRolesDialog
        open={assignRolesDialog.open}
        user={assignRolesDialog.user}
        roles={assignRolesDialog.roles}
        isLoading={assignRolesDialog.isLoading}
        isSaving={assignRolesDialog.isSaving}
        onOpenChange={(open) => {
          if (!open) {
            assignRolesDialog.onClose()
          }
        }}
        onSave={assignRolesDialog.onSave}
      />
    </>
  )
}
