"use client"

import { OperationLogDetailSheet } from "@/components/base/logs/operation-log-detail-sheet"
import { OperationLogsPageView } from "@/components/base/logs/operation-logs-page-container"
import { useOperationLogsController } from "@/components/base/logs/hooks/use-operation-logs-controller"

export default function OperationLogsPage() {
  const { view, detail } = useOperationLogsController()

  return (
    <>
      <OperationLogsPageView {...view} />

      <OperationLogDetailSheet
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
