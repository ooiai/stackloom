import type { StorageObjectData, StorageProviderData } from "@/types/storage.types"

export const DEFAULT_STORAGE_PAGE_SIZE = 20
const STORAGE_IMAGE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
])

export interface StorageRowData extends StorageObjectData {
  id: string
}

export function parseStoragePageSize(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    return fallback
  }

  return Math.floor(parsed)
}

export function normalizeStoragePrefix(value: string) {
  const trimmed = value.trim().replace(/^\/+/, "").replace(/\/+$/, "")
  return trimmed.length > 0 ? trimmed : undefined
}

export function isStorageImageKey(value: string) {
  const trimmed = value.trim().split("?")[0]
  const lastSegment = trimmed.split("/").pop() ?? ""
  const extension = lastSegment.includes(".") ? lastSegment.split(".").pop()?.toLowerCase() : undefined
  return extension ? STORAGE_IMAGE_EXTENSIONS.has(extension) : false
}

export function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  )
  const value = bytes / Math.pow(1024, index)

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function formatStorageValue(value: string | null | undefined, fallback = "—") {
  return value && value.trim().length > 0 ? value : fallback
}

export function toStorageRows(items: StorageObjectData[]): StorageRowData[] {
  return items.map((item) => ({
    ...item,
    id: `${item.provider}:${item.bucket}:${item.key}`,
  }))
}

export function findStorageProviderLabel(
  providers: StorageProviderData[],
  code: string
) {
  return providers.find((provider) => provider.code === code)?.label ?? code
}
