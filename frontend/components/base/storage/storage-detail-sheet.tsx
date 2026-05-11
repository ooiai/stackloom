"use client"

import { LogDetailSheet } from "@/components/base/logs/log-detail-sheet"
import { useI18n } from "@/providers/i18n-provider"
import type { StorageRowData } from "./helpers"
import { formatStorageValue } from "./helpers"
import { formatDateTimeAt } from "@/lib/time"

interface StorageDetailSheetProps {
  open: boolean
  item: StorageRowData | null
  onOpenChange: (open: boolean) => void
}

export function StorageDetailSheet({
  open,
  item,
  onOpenChange,
}: StorageDetailSheetProps) {
  const { t } = useI18n()

  if (!item) {
    return null
  }

  return (
    <LogDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("storage.detail.title")}
      description={t("storage.detail.description")}
      fields={[
        { label: t("storage.fields.provider"), value: item.provider },
        { label: t("storage.fields.bucket"), value: item.bucket },
        { label: t("storage.fields.key"), value: item.key },
        { label: t("storage.fields.size"), value: String(item.size) },
        {
          label: t("storage.fields.etag"),
          value: formatStorageValue(item.etag),
        },
        {
          label: t("storage.fields.storageClass"),
          value: formatStorageValue(item.storage_class),
        },
        {
          label: t("storage.fields.lastModified"),
          value: item.last_modified
            ? formatDateTimeAt(item.last_modified)
            : t("common.misc.none"),
        },
        { label: t("storage.fields.publicUrl"), value: item.public_url },
      ]}
    />
  )
}
