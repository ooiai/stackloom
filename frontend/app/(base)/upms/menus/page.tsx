"use client"

import { MenuMutateSheet } from "@/components/base/menus/menu-mutate-sheet"
import { useMenusController } from "@/components/base/menus/hooks/use-menus-controller"
import { MenusPageView } from "@/components/base/menus/menus-page-container"

export default function MenusPage() {
  const { view, sheet } = useMenusController()

  return (
    <>
      <MenusPageView {...view} />

      <MenuMutateSheet
        key={`${sheet.mode}-${sheet.menu?.id ?? "new"}-${sheet.parent?.id ?? "root"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        menu={sheet.menu}
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
