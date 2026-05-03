"use client"

import { AuditLogDetailSheet } from "@/components/base/logs/audit-log-detail-sheet"
import { AuditLogsPageView } from "@/components/base/logs/audit-logs-page-container"
import { useAuditLogsController } from "@/components/base/logs/hooks/use-audit-logs-controller"

export default function AuditLogsPage() {
  const { view, detail } = useAuditLogsController()

  return (
    <>
      <AuditLogsPageView {...view} />

      <AuditLogDetailSheet
        open={detail.open}
        log={detail.log}
        onOpenChange={(open) => {
          if (!open) {
            detail.onClose()
          }
        }}
      />
    </>
  )
}
