"use client"

import { LogDetailSheet } from "@/components/base/logs/log-detail-sheet"
import { formatLogValue } from "@/components/base/logs/helpers"
import { formatDateTimeAt } from "@/lib/time"
import { useI18n } from "@/providers/i18n-provider"
import type { OperationLogData } from "@/types/logs.types"

interface OperationLogDetailSheetProps {
  open: boolean
  log: OperationLogData | null
  onOpenChange: (open: boolean) => void
}

export function OperationLogDetailSheet({
  open,
  log,
  onOpenChange,
}: OperationLogDetailSheetProps) {
  const { t } = useI18n()

  if (!log) {
    return null
  }

  return (
    <LogDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("logs.operation.detail.title")}
      description={t("logs.operation.detail.description")}
      fields={[
        { label: t("logs.common.fields.id"), value: log.id },
        {
          label: t("logs.common.fields.tenantId"),
          value: formatLogValue(log.tenant_id),
        },
        {
          label: t("logs.common.fields.operatorId"),
          value: formatLogValue(log.operator_id),
        },
        { label: t("logs.common.fields.module"), value: log.module },
        { label: t("logs.common.fields.bizType"), value: log.biz_type },
        {
          label: t("logs.common.fields.bizId"),
          value: formatLogValue(log.biz_id),
        },
        { label: t("logs.common.fields.operation"), value: log.operation },
        { label: t("logs.common.fields.summary"), value: log.summary },
        { label: t("logs.common.fields.result"), value: String(log.result) },
        {
          label: t("logs.common.fields.traceId"),
          value: formatLogValue(log.trace_id),
        },
        {
          label: t("logs.common.fields.createdAt"),
          value: formatDateTimeAt(log.created_at),
        },
      ]}
      jsonSections={[
        {
          title: t("logs.common.sections.beforeSnapshot"),
          value: log.before_snapshot,
        },
        {
          title: t("logs.common.sections.afterSnapshot"),
          value: log.after_snapshot,
        },
      ]}
    />
  )
}
