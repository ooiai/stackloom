"use client"

import { StatsOverviewContainer } from "@/components/base/stats/stats-overview-container"
import { useStatsController } from "@/components/base/stats/hooks/use-stats-controller"

export default function BizStatsOverviewPage() {
  const { days } = useStatsController()
  return <StatsOverviewContainer days={days} />
}
