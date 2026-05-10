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
import { Button } from "@/components/ui/button"

// 保留期限选项
const RETENTION_OPTIONS = [
  { label: 'Keep all', value: null },
  { label: '1 week', value: 7 },
  { label: '1 month', value: 30 },
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
  { label: '1 year', value: 365 },
] as const

interface LogRetentionSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logType: 'system_log' | 'audit_log' | 'operation_log'
}

export function LogRetentionSettingsSheet({
  open,
  onOpenChange,
  logType,
}: LogRetentionSettingsSheetProps) {
  const { t } = useI18n()
  const [policy, setPolicy] = useState<LogRetentionPolicy | null>(null)
  const [selectedDays, setSelectedDays] = useState<number | null | string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 打开 Sheet 时加载当前策略
  const handleOpenChange = async (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) {
      setIsLoading(true)
      setError(null)
      try {
        const data = await logRetentionApi.getPolicy(logType)
        setPolicy(data)
        setSelectedDays(data.retentionDays ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policy')
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
      const retentionDays = selectedDays === '' ? null : (selectedDays as number)
      const updated = await logRetentionApi.updatePolicy(logType, retentionDays)
      setPolicy(updated)
      onOpenChange(false)
      // 可选：显示成功提示
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('logs.retention_settings')}</SheetTitle>
          <SheetDescription>
            {t('logs.retention_period_description')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* 下拉选择框 - 使用按钮组样式 */}
          <div>
            <label className="text-sm font-medium">
              {t('logs.retention_period')}
            </label>
            <div className="mt-2 space-y-2">
              {RETENTION_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant={selectedDays === option.value ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedDays(option.value)}
                  disabled={isLoading}
                >
                  {t(`logs.retention_${option.label.toLowerCase().replace(/\s+/g, '_')}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* 最后清理时间显示 */}
          {policy?.lastCleanupAt && (
            <div className="text-sm">
              <span className="font-medium">{t('logs.last_cleanup')}: </span>
              <span className="text-gray-600">
                {new Date(policy.lastCleanupAt).toLocaleString()}
              </span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('logs.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? t('logs.saving') : t('logs.save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
