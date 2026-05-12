"use client"

import { StatsGrowthContainer } from "@/components/base/stats/stats-growth-container"
import { useStatsController } from "@/components/base/stats/hooks/use-stats-controller"

export default function BizStatsGrowthPage() {
  const { days } = useStatsController()
  return <StatsGrowthContainer days={days} />
}
