"use client"

import { StorageDetailSheet } from "@/components/base/storage/storage-detail-sheet"
import { StorageImagePreviewDialog } from "@/components/base/storage/storage-image-preview-dialog"
import { StoragePageContainer } from "@/components/base/storage/storage-page-container"
import { useStorageController } from "@/components/base/storage/hooks/use-storage-controller"

export default function StoragePage() {
  const { view, detail, imagePreview } = useStorageController()

  return (
    <>
      <StoragePageContainer {...view} />

      <StorageDetailSheet
        open={detail.open}
        item={detail.item}
        onOpenChange={(open) => {
          if (!open) {
            detail.onClose()
          }
        }}
      />

      <StorageImagePreviewDialog
        open={imagePreview.open}
        item={imagePreview.item}
        signedUrl={imagePreview.signedUrl}
        onOpenChange={(open) => {
          if (!open) {
            imagePreview.onClose()
          }
        }}
      />
    </>
  )
}
