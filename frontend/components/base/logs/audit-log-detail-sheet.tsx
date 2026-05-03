"use client"

import { LogDetailSheet } from "@/components/base/logs/log-detail-sheet"
import { formatLogValue } from "@/components/base/logs/helpers"
import { formatDateTimeAt } from "@/lib/time"
import { useI18n } from "@/providers/i18n-provider"
import type { AuditLogData } from "@/types/logs.types"

interface AuditLogDetailSheetProps {
  open: boolean
  log: AuditLogData | null
  onOpenChange: (open: boolean) => void
}

export function AuditLogDetailSheet({
  open,
  log,
  onOpenChange,
}: AuditLogDetailSheetProps) {
  const { t } = useI18n()

  if (!log) {
    return null
  }

  return (
    <LogDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("logs.audit.detail.title")}
      description={t("logs.audit.detail.description")}
      fields={[
        { label: t("logs.common.fields.id"), value: log.id },
        { label: t("logs.common.fields.traceId"), value: formatLogValue(log.trace_id) },
        {
          label: t("logs.common.fields.tenantId"),
          value: formatLogValue(log.tenant_id),
        },
        {
          label: t("logs.common.fields.operatorId"),
          value: formatLogValue(log.operator_id),
        },
        {
          label: t("logs.common.fields.targetType"),
          value: log.target_type,
        },
        { label: t("logs.common.fields.targetId"), value: log.target_id },
        { label: t("logs.common.fields.action"), value: log.action },
        { label: t("logs.common.fields.result"), value: log.result },
        { label: t("logs.common.fields.reason"), value: formatLogValue(log.reason) },
        { label: t("logs.common.fields.ip"), value: formatLogValue(log.ip) },
        {
          label: t("logs.common.fields.userAgent"),
          value: formatLogValue(log.user_agent),
        },
        {
          label: t("logs.common.fields.createdAt"),
          value: formatDateTimeAt(log.created_at),
        },
      ]}
      jsonSections={[
        {
          title: t("logs.common.sections.beforeData"),
          value: log.before_data,
        },
        {
          title: t("logs.common.sections.afterData"),
          value: log.after_data,
        },
      ]}
    />
  )
}
