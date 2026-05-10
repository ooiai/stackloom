"use client"

import { LogDetailSheet } from "@/components/base/logs/log-detail-sheet"
import { formatLogValue } from "@/components/base/logs/helpers"
import { formatDateTimeAt } from "@/lib/time"
import { useI18n } from "@/providers/i18n-provider"
import type { SystemLogData } from "@/types/logs.types"

interface SystemLogDetailSheetProps {
  open: boolean
  log: SystemLogData | null
  onOpenChange: (open: boolean) => void
}

export function SystemLogDetailSheet({
  open,
  log,
  onOpenChange,
}: SystemLogDetailSheetProps) {
  const { t } = useI18n()

  if (!log) {
    return null
  }

  return (
    <LogDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("logs.system.detail.title")}
      description={t("logs.system.detail.description")}
      fields={[
        { label: t("logs.common.fields.id"), value: log.id },
        {
          label: t("logs.common.fields.traceId"),
          value: formatLogValue(log.trace_id),
        },
        {
          label: t("logs.common.fields.requestId"),
          value: formatLogValue(log.request_id),
        },
        { label: t("logs.common.fields.method"), value: log.method },
        { label: t("logs.common.fields.path"), value: log.path },
        {
          label: t("logs.common.fields.module"),
          value: formatLogValue(log.module),
        },
        {
          label: t("logs.common.fields.action"),
          value: formatLogValue(log.action),
        },
        {
          label: t("logs.common.fields.result"),
          value: formatLogValue(log.result),
        },
        {
          label: t("logs.common.fields.statusCode"),
          value: String(log.status_code),
        },
        {
          label: t("logs.common.fields.latency"),
          value: `${log.latency_ms} ms`,
        },
        {
          label: t("logs.common.fields.tenantId"),
          value: formatLogValue(log.tenant_id),
        },
        {
          label: t("logs.common.fields.operatorId"),
          value: formatLogValue(log.operator_id),
        },
        { label: t("logs.common.fields.ip"), value: formatLogValue(log.ip) },
        {
          label: t("logs.common.fields.userAgent"),
          value: formatLogValue(log.user_agent),
        },
        {
          label: t("logs.common.fields.errorCode"),
          value: formatLogValue(log.error_code),
        },
        {
          label: t("logs.common.fields.errorMessage"),
          value: formatLogValue(log.error_message),
        },
        {
          label: t("logs.common.fields.createdAt"),
          value: formatDateTimeAt(log.created_at),
        },
      ]}
      jsonSections={[
        {
          title: t("logs.common.sections.extra"),
          value: log.ext,
        },
      ]}
    />
  )
}
