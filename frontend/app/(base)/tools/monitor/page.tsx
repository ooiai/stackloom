"use client"

import { MonitorPageContainer } from "@/components/base/monitor/monitor-page-container"
import { useMonitorController } from "@/components/base/monitor/hooks/use-monitor-controller"

export default function MonitorPage() {
  const { view } = useMonitorController()
  return <MonitorPageContainer {...view} />
}
