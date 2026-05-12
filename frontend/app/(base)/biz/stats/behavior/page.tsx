"use client"

import { StatsBehaviorContainer } from "@/components/base/stats/stats-behavior-container"
import { useStatsController } from "@/components/base/stats/hooks/use-stats-controller"

export default function BizStatsBehaviorPage() {
  const { days } = useStatsController()
  return <StatsBehaviorContainer days={days} />
}
