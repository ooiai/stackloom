"use client"

import { PermMutateSheet } from "@/components/base/perms/perm-mutate-sheet"
import { usePermsController } from "@/components/base/perms/hooks/use-perms-controller"
import { PermsPageView } from "@/components/base/perms/perms-page-container"

export default function PermsPage() {
  const { view, sheet } = usePermsController()

  return (
    <>
      <PermsPageView {...view} />

      <PermMutateSheet
        key={`${sheet.mode}-${sheet.perm?.id ?? "new"}-${sheet.parent?.id ?? "root"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        perm={sheet.perm}
        parent={sheet.parent}
        parentTree={sheet.parentTree}
        isParentTreeLoading={sheet.isParentTreeLoading}
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
