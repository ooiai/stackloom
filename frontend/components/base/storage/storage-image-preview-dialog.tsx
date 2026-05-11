"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ImageOffIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"
import type { StorageRowData } from "./helpers"
import { StorageImageZoom } from "./storage-image-zoom"

interface StorageImagePreviewDialogProps {
  open: boolean
  item: StorageRowData | null
  signedUrl: string | null
  onOpenChange: (open: boolean) => void
}

function StorageImageContent({
  signedUrl,
  alt,
}: {
  signedUrl: string
  alt: string
}) {
  const { t } = useI18n()
  const [loadError, setLoadError] = useState(false)

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <ImageOffIcon className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t("storage.previewDialog.loadErrorTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("storage.previewDialog.loadErrorDescription")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <StorageImageZoom className="max-w-full">
      {/* Signed OSS preview URLs use dynamic hosts, so next/image is not a good fit here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signedUrl}
        alt={alt}
        className="max-h-[calc(90vh-10rem)] w-auto max-w-full rounded-2xl border border-border/60 bg-background object-contain shadow-sm"
        onError={() => setLoadError(true)}
      />
    </StorageImageZoom>
  )
}

export function StorageImagePreviewDialog({
  open,
  item,
  signedUrl,
  onOpenChange,
}: StorageImagePreviewDialogProps) {
  const { t } = useI18n()

  if (!item || !signedUrl) {
    return null
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[min(90vh,52rem)] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
            <div className="min-w-0 space-y-1">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {t("storage.previewDialog.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {t("storage.previewDialog.description")}
              </DialogPrimitive.Description>
              <p className="truncate text-xs text-muted-foreground">
                {item.bucket} / {item.provider}
              </p>
            </div>

            <DialogPrimitive.Close
              render={<Button variant="outline" size="icon-sm" type="button" />}
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/20 p-4 sm:p-6">
            <StorageImageContent key={signedUrl} signedUrl={signedUrl} alt={item.key} />
          </div>

          <div className="border-t border-border/60 px-6 py-3">
            <p className="truncate text-xs text-muted-foreground">{item.key}</p>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
