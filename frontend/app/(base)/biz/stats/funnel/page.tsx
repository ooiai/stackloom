"use client"

import { StatsFunnelContainer } from "@/components/base/stats/stats-funnel-container"
import { useStatsController } from "@/components/base/stats/hooks/use-stats-controller"

export default function BizStatsFunnelPage() {
  const { days } = useStatsController()
  return <StatsFunnelContainer days={days} />
}
