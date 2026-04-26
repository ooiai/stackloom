"use client"

import { DictMutateSheet } from "@/components/base/dicts/dict-mutate-sheet"
import { useDictsController } from "@/components/base/dicts/hooks/use-dicts-controller"
import { DictsPageView } from "@/components/base/dicts/dicts-page-container"

export default function DictsPage() {
  const { view, sheet } = useDictsController()

  return (
    <>
      <DictsPageView {...view} />

      <DictMutateSheet
        key={`${sheet.mode}-${sheet.dict?.id ?? "new"}-${sheet.parent?.id ?? "root"}-${sheet.open ? "open" : "closed"}`}
        open={sheet.open}
        mode={sheet.mode}
        dict={sheet.dict}
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
