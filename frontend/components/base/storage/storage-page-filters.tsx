"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { useI18n } from "@/providers/i18n-provider"
import type { StorageProviderData } from "@/types/storage.types"
import { FunnelXIcon } from "lucide-react"

interface StoragePageFiltersProps {
  providers: StorageProviderData[]
  provider: string
  prefix: string
  pageSize: number
  currentBucket: string
  hasActiveFilters: boolean
  isLoading: boolean
  onProviderChange: (value: string) => void
  onPrefixChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onClear: () => void
}

export function StoragePageFilters({
  providers,
  provider,
  prefix,
  pageSize,
  currentBucket,
  hasActiveFilters,
  isLoading,
  onProviderChange,
  onPrefixChange,
  onPageSizeChange,
  onClear,
}: StoragePageFiltersProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-2.5">
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_160px_auto] md:items-end">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("storage.filters.provider.label")}
          </p>
          <Select
            value={provider}
            onValueChange={(value) => {
              if (value) {
                onProviderChange(value)
              }
            }}
            disabled={isLoading || providers.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("storage.filters.provider.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {providers.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("storage.filters.prefix.label")}
          </p>
          <Input
            value={prefix}
            onChange={(event) => onPrefixChange(event.target.value)}
            placeholder={t("storage.filters.prefix.placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("storage.filters.pageSize.label")}
          </p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) {
                onPageSizeChange(Number(value))
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {t("storage.filters.pageSize.option", { value: size })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters ? (
          <div className="flex md:justify-end">
            <Button variant="outline" size="sm" onClick={onClear}>
              <FunnelXIcon />
              {t("common.actions.clear")}
            </Button>
          </div>
        ) : null}
      </div>

      {currentBucket ? (
        <p className="text-xs text-muted-foreground">
          {t("storage.fields.bucket")}: {currentBucket}
        </p>
      ) : null}
    </div>
  )
}
