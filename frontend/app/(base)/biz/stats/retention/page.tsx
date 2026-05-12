"use client"

import { StatsRetentionContainer } from "@/components/base/stats/stats-retention-container"
import { useStatsController } from "@/components/base/stats/hooks/use-stats-controller"

export default function BizStatsRetentionPage() {
  const { days } = useStatsController()
  return <StatsRetentionContainer days={days} />
}
