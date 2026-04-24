"use client"

import { UserMutateSheet } from "@/components/base/users/user-mutate-sheet"
import { UsersPageView } from "@/components/base/users/users-page-container"
import { useUsersController } from "@/hooks/use-users-controller"

export default function UserPage() {
  const { view, sheet } = useUsersController()

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
    </>
  )
}
