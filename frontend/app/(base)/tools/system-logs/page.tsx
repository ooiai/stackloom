"use client"

import { SystemLogDetailSheet } from "@/components/base/logs/system-log-detail-sheet"
import { SystemLogsPageView } from "@/components/base/logs/system-logs-page-container"
import { useSystemLogsController } from "@/components/base/logs/hooks/use-system-logs-controller"

export default function SystemLogsPage() {
  const { view, detail } = useSystemLogsController()

  return (
    <>
      <SystemLogsPageView {...view} />

      <SystemLogDetailSheet
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
