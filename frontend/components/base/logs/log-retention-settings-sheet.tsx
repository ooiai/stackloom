"use client"

import { useState } from "react"
import { useI18n } from "@/providers/i18n-provider"
import { logRetentionApi } from "@/stores/base-api"
import type { LogRetentionPolicy } from "@/types/logs.types"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const RETENTION_OPTIONS = [
  { label: "Keep all", value: null, i18nKey: "logs.keep_all" },
  { label: "1 week", value: 7, i18nKey: "logs.one_week" },
  { label: "1 month", value: 30, i18nKey: "logs.one_month" },
  { label: "3 months", value: 90, i18nKey: "logs.three_months" },
  { label: "6 months", value: 180, i18nKey: "logs.six_months" },
  { label: "1 year", value: 365, i18nKey: "logs.one_year" },
] as const

interface LogRetentionSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logType: "system_log" | "audit_log" | "operation_log"
}

export function LogRetentionSettingsSheet({
  open,
  onOpenChange,
  logType,
}: LogRetentionSettingsSheetProps) {
  const { t } = useI18n()
  const [policy, setPolicy] = useState<LogRetentionPolicy | null>(null)
  const [selectedDays, setSelectedDays] = useState<number | null | string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = async (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) {
      setIsLoading(true)
      setError(null)
      try {
        const data = await logRetentionApi.getPolicy(logType)
        setPolicy(data)
        setSelectedDays(data.retentionDays ?? "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load policy")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!policy) return

    setIsLoading(true)
    setError(null)
    try {
      const retentionDays =
        selectedDays === "" ? null : (selectedDays as number)
      const updated = await logRetentionApi.updatePolicy(logType, retentionDays)
      setPolicy(updated)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update policy")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("logs.retention_settings")}</SheetTitle>
          <SheetDescription>
            {t("logs.retention_period_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="mb-4 block text-sm font-medium">
              {t("logs.retention_period")}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RETENTION_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedDays(option.value)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    selectedDays === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background hover:border-primary/50 hover:bg-muted/30"
                  } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      selectedDays === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background"
                    }`}
                  >
                    {selectedDays === option.value && <span className="text-xs font-bold">✓</span>}
                  </span>
                  <span className="flex-1 text-left">{t(option.i18nKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {policy?.lastCleanupAt && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">
                {t("logs.last_cleanup")}
              </div>
              <div className="mt-1 text-sm font-medium">
                {new Date(policy.lastCleanupAt).toLocaleString()}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-t pt-4">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("logs.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? t("logs.saving") : t("logs.save")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
