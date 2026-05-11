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
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-medium text-muted-foreground">
            {t("storage.filters.provider.label")}
          </span>
          <Select
            value={provider}
            onValueChange={(value) => {
              if (value) {
                onProviderChange(value)
              }
            }}
            disabled={isLoading || providers.length === 0}
          >
            <SelectTrigger className="w-[200px]">
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

        <div className="flex min-w-[280px] flex-1 items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {t("storage.filters.prefix.label")}
          </span>
          <Input
            className="min-w-[180px] flex-1"
            value={prefix}
            onChange={(event) => onPrefixChange(event.target.value)}
            placeholder={t("storage.filters.prefix.placeholder")}
          />
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-medium text-muted-foreground">
            {t("storage.filters.pageSize.label")}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) {
                onPageSizeChange(Number(value))
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
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
          <Button variant="outline" size="sm" onClick={onClear} className="sm:ml-auto">
            <FunnelXIcon />
            {t("common.actions.clear")}
          </Button>
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
